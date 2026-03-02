const pool = require('../config/db');

exports.addTransaction = async (req, res) => {
  try {
    const { title, amount, type, category } = req.body;
    const userId = req.user.userId;

      if (!title || !amount || !type) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }

      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: "Invalid transaction type" });
      }

      if (title.length > 100) {
        return res.status(400).json({ message: "Title too long" });
      }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, title, amount, type, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title, amount, type, category]
    );

    res.status(201).json({
      message: "Transaction added",
      transaction: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// Get User Transactions

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const { type, startDate, endDate } = req.query;

    let query = `
      SELECT * FROM transactions
      WHERE user_id = $1
    `;

    const values = [userId];
    let index = 2;

    if (type) {
      query += ` AND type = $${index}`;
      values.push(type);
      index++;
    }

      if (startDate) {
        query += ` AND created_at >= $${index}`;
        values.push(new Date(startDate));
        index++;
      }

      if (endDate) {
        query += ` AND created_at <= $${index}`;
        values.push(new Date(endDate));
        index++;
      }

    query += `
      ORDER BY created_at DESC
      LIMIT $${index} OFFSET $${index + 1}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.status(200).json({
      page,
      limit,
      transactions: result.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// Get Summary (Total Income, Total Expense, Balance)

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_income 
       FROM transactions 
       WHERE user_id = $1 AND type = 'income'`,
      [userId]
    );

    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expense 
       FROM transactions 
       WHERE user_id = $1 AND type = 'expense'`,
      [userId]
    );

    const totalIncome = parseFloat(incomeResult.rows[0].total_income);
    const totalExpense = parseFloat(expenseResult.rows[0].total_expense);

    res.status(200).json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//How much money did I spend per category?
exports.getCategoryBreakdown = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT category, 
              SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       GROUP BY category
       ORDER BY total DESC`,
      [userId]
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//Add Update Function
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, type, category } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(
      `UPDATE transactions
       SET title = $1,
           amount = $2,
           type = $3,
           category = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [title, amount, type, category, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({
      message: "Transaction updated",
      transaction: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//Add Delete Function
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `DELETE FROM transactions
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//Add Monthly Trend Controller
exports.getMonthlyTrend = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      WHERE user_id = $1
      GROUP BY month
      ORDER BY month ASC
      `,
      [userId]
    );

    res.status(200).json(
      result.rows.map(row => ({
        month: row.month,
        income: parseFloat(row.income),
        expense: parseFloat(row.expense)
      }))
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Smart Insights
exports.getInsights = async (req, res) => {
  try {
    const userId = req.user.userId;
    const insights = [];

    // 1. Top spending category this month vs last month
    const topCategoryChange = await pool.query(
      `
      WITH current_month AS (
        SELECT category, SUM(amount) AS total
        FROM transactions
        WHERE user_id = $1 AND type = 'expense'
          AND TO_CHAR(created_at, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM')
        GROUP BY category
        ORDER BY total DESC
        LIMIT 1
      ),
      last_month AS (
        SELECT category, SUM(amount) AS total
        FROM transactions
        WHERE user_id = $1 AND type = 'expense'
          AND TO_CHAR(created_at, 'YYYY-MM') = TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM')
        GROUP BY category
      )
      SELECT
        cm.category,
        cm.total AS current_total,
        COALESCE(lm.total, 0) AS last_total
      FROM current_month cm
      LEFT JOIN last_month lm ON cm.category = lm.category
      `,
      [userId]
    );

    if (topCategoryChange.rows.length > 0) {
      const row = topCategoryChange.rows[0];
      const current = parseFloat(row.current_total);
      const last = parseFloat(row.last_total);
      if (last > 0) {
        const pctChange = Math.round(((current - last) / last) * 100);
        if (pctChange > 0) {
          insights.push({
            icon: "🔺",
            text: `You spent ${pctChange}% more on ${row.category} this month`,
            type: "warning"
          });
        } else if (pctChange < 0) {
          insights.push({
            icon: "🟢",
            text: `You spent ${Math.abs(pctChange)}% less on ${row.category} this month`,
            type: "success"
          });
        }
      } else {
        insights.push({
          icon: "📊",
          text: `Your top spending category this month is ${row.category} (₹${current})`,
          type: "info"
        });
      }
    }

    // 2. Expense trend: this month vs last month total
    const expenseTrend = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN TO_CHAR(created_at, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM') THEN amount END), 0) AS current_expense,
        COALESCE(SUM(CASE WHEN TO_CHAR(created_at, 'YYYY-MM') = TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM') THEN amount END), 0) AS last_expense
      FROM transactions
      WHERE user_id = $1 AND type = 'expense'
      `,
      [userId]
    );

    const currExp = parseFloat(expenseTrend.rows[0].current_expense);
    const lastExp = parseFloat(expenseTrend.rows[0].last_expense);

    if (lastExp > 0) {
      const trendPct = Math.round(((currExp - lastExp) / lastExp) * 100);
      if (trendPct > 0) {
        insights.push({
          icon: "📈",
          text: `Your expense trend increased ${trendPct}% compared to last month`,
          type: "warning"
        });
      } else if (trendPct < 0) {
        insights.push({
          icon: "📉",
          text: `Your expenses decreased ${Math.abs(trendPct)}% compared to last month`,
          type: "success"
        });
      } else {
        insights.push({
          icon: "➡️",
          text: `Your expenses are the same as last month`,
          type: "info"
        });
      }
    }

    // 3. Savings rate
    const totals = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expense
      FROM transactions
      WHERE user_id = $1
      `,
      [userId]
    );

    const totalIncome = parseFloat(totals.rows[0].total_income);
    const totalExpense = parseFloat(totals.rows[0].total_expense);

    if (totalIncome > 0) {
      const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
      insights.push({
        icon: savingsRate >= 20 ? "🏆" : savingsRate >= 0 ? "💰" : "⚠️",
        text: `Your savings rate is ${savingsRate}%`,
        type: savingsRate >= 20 ? "success" : savingsRate >= 0 ? "info" : "warning"
      });
    }

    // 4. Highest single expense
    const biggestExpense = await pool.query(
      `
      SELECT title, amount, category
      FROM transactions
      WHERE user_id = $1 AND type = 'expense'
      ORDER BY amount DESC
      LIMIT 1
      `,
      [userId]
    );

    if (biggestExpense.rows.length > 0) {
      const b = biggestExpense.rows[0];
      insights.push({
        icon: "💸",
        text: `Your biggest expense is "${b.title}" — ₹${parseFloat(b.amount)}`,
        type: "info"
      });
    }

    res.status(200).json(insights);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};