const pool = require('../config/db');

// Create budgets table if not exists
const initBudgetTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, category)
      )
    `);
    console.log("Budgets table ready");
  } catch (error) {
    console.error("Error creating budgets table:", error.message);
  }
};

initBudgetTable();

// Set or update a budget for a category
exports.setBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, amount } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ message: "Category and amount are required" });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    // Upsert: insert or update if category already exists
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category, amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, category)
       DO UPDATE SET amount = $3
       RETURNING *`,
      [userId, category, amount]
    );

    res.status(200).json({
      message: "Budget set",
      budget: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all budgets for user
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT * FROM budgets WHERE user_id = $1 ORDER BY category ASC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a budget
exports.deleteBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json({ message: "Budget deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get budget status — compares budget vs actual spending over a chosen period
exports.getBudgetStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Accept ?days=30|60|90 (default 30)
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
    const months = days / 30; // multiplier for budget comparison

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.category,
        b.amount AS budget_amount,
        COALESCE(SUM(
          CASE WHEN t.created_at >= NOW() - ($2 || ' days')::INTERVAL
          THEN t.amount ELSE 0 END
        ), 0) AS spent,
        COUNT(
          CASE WHEN t.created_at >= NOW() - ($2 || ' days')::INTERVAL
          THEN 1 END
        ) AS transaction_count
      FROM budgets b
      LEFT JOIN transactions t
        ON t.user_id = b.user_id
        AND LOWER(t.category) = LOWER(b.category)
        AND t.type = 'expense'
      WHERE b.user_id = $1
      GROUP BY b.id, b.category, b.amount
      ORDER BY b.category ASC
      `,
      [userId, days]
    );

    const statuses = result.rows.map(row => {
      const monthlyBudget = parseFloat(row.budget_amount);
      // Scale the budget by the number of months in the selected period
      const budgetAmount = parseFloat((monthlyBudget * months).toFixed(2));
      const spent = parseFloat(row.spent);
      const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
      // Predict full-period spend based on progress so far
      const dayProgress = days > 0 ? 1 : 1; // always full period view
      const predictedOvershoot = spent > budgetAmount
        ? Math.round(spent - budgetAmount)
        : 0;

      let status = "safe";
      if (percentage >= 100) status = "exceeded";
      else if (percentage >= 80) status = "warning";

      return {
        id: row.id,
        category: row.category,
        monthlyBudget,
        budgetAmount,
        spent,
        percentage,
        predictedOvershoot,
        status,
        transactionCount: parseInt(row.transaction_count)
      };
    });

    res.status(200).json({
      days,
      budgets: statuses
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// AI Budget Auto-Creation — suggests budgets based on past 3 months
exports.suggestBudgets = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get average spending per category over last 3 months
    const result = await pool.query(
      `SELECT
         category,
         ROUND(AVG(monthly_total)::numeric, 2) AS avg_monthly,
         ROUND(MAX(monthly_total)::numeric, 2) AS max_monthly,
         ROUND(MIN(monthly_total)::numeric, 2) AS min_monthly,
         COUNT(DISTINCT month) AS months_with_data
       FROM (
         SELECT
           category,
           TO_CHAR(created_at, 'YYYY-MM') AS month,
           SUM(amount) AS monthly_total
         FROM transactions
         WHERE user_id = $1
           AND type = 'expense'
           AND category IS NOT NULL
           AND created_at >= NOW() - INTERVAL '3 months'
         GROUP BY category, TO_CHAR(created_at, 'YYYY-MM')
       ) sub
       GROUP BY category
       ORDER BY avg_monthly DESC`,
      [userId]
    );

    // Get existing budgets
    const existing = await pool.query(
      `SELECT category, amount FROM budgets WHERE user_id = $1`,
      [userId]
    );
    const existingMap = {};
    existing.rows.forEach(r => {
      existingMap[r.category.toLowerCase()] = parseFloat(r.amount);
    });

    const suggestions = result.rows.map(r => {
      const avg = parseFloat(r.avg_monthly);
      const max = parseFloat(r.max_monthly);
      const suggestedBudget = Math.round(avg * 1.1); // 10% above average
      const tightBudget = Math.round(avg * 0.9);     // 10% below (aggressive)
      const existingBudget = existingMap[r.category.toLowerCase()] || null;

      return {
        category: r.category,
        avgMonthlySpend: Math.round(avg),
        maxMonthlySpend: Math.round(max),
        minMonthlySpend: Math.round(parseFloat(r.min_monthly)),
        suggestedBudget,
        tightBudget,
        existingBudget,
        monthsAnalyzed: parseInt(r.months_with_data),
        recommendation: existingBudget
          ? existingBudget < avg
            ? '⚠️ Current budget is below your average spending'
            : existingBudget > max * 1.3
            ? '📉 Budget seems too generous, consider reducing'
            : '✅ Budget looks appropriate'
          : '📌 No budget set — consider adding one'
      };
    });

    const totalSuggested = suggestions.reduce((s, sg) => s + sg.suggestedBudget, 0);
    const totalAvg = suggestions.reduce((s, sg) => s + sg.avgMonthlySpend, 0);

    res.status(200).json({
      suggestions,
      summary: {
        categoriesAnalyzed: suggestions.length,
        totalSuggestedBudget: totalSuggested,
        totalAvgSpending: totalAvg,
        potentialSavings: Math.round(totalAvg * 0.1)
      },
      message: `Based on your last 3 months, we recommend a total budget of ₹${totalSuggested}/month across ${suggestions.length} categories.`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
