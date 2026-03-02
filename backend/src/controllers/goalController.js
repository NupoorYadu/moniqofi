const pool = require('../config/db');

// Auto-create goals table
const initGoalTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        title VARCHAR(200) NOT NULL,
        target_amount NUMERIC(12,2) NOT NULL,
        saved_amount NUMERIC(12,2) DEFAULT 0,
        deadline DATE,
        category VARCHAR(100),
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Goals table ready");
  } catch (error) {
    console.error("Error creating goals table:", error.message);
  }
};

initGoalTable();

// Create a new goal
exports.createGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, targetAmount, deadline, category, priority } = req.body;

    if (!title || !targetAmount) {
      return res.status(400).json({ message: "Title and target amount are required" });
    }

    if (typeof targetAmount !== 'number' || targetAmount <= 0) {
      return res.status(400).json({ message: "Target amount must be a positive number" });
    }

    const result = await pool.query(
      `INSERT INTO goals (user_id, title, target_amount, deadline, category, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title, targetAmount, deadline || null, category || null, priority || 'medium']
    );

    res.status(201).json({
      message: "Goal created",
      goal: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all goals
exports.getGoals = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT * FROM goals WHERE user_id = $1 ORDER BY
        CASE WHEN status = 'active' THEN 0 ELSE 1 END,
        CASE WHEN priority = 'high' THEN 0 WHEN priority = 'medium' THEN 1 ELSE 2 END,
        created_at DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add money to a goal
exports.contributeToGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const result = await pool.query(
      `UPDATE goals
       SET saved_amount = saved_amount + $1,
           updated_at = NOW(),
           status = CASE
             WHEN saved_amount + $1 >= target_amount THEN 'completed'
             ELSE status
           END
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [amount, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({
      message: "Contribution added",
      goal: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a goal
exports.deleteGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({ message: "Goal deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get goal status with projections
exports.getGoalStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const goals = await pool.query(
      `SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    // Get monthly savings average for projection
    const savings = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income' THEN amount END),0) AS total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) AS total_expense,
         COUNT(DISTINCT TO_CHAR(created_at,'YYYY-MM')) AS months
       FROM transactions WHERE user_id = $1`,
      [userId]
    );

    const totalInc = parseFloat(savings.rows[0].total_income);
    const totalExp = parseFloat(savings.rows[0].total_expense);
    const months = parseInt(savings.rows[0].months) || 1;
    const avgMonthlySavings = (totalInc - totalExp) / months;

    const goalsWithStatus = goals.rows.map(goal => {
      const target = parseFloat(goal.target_amount);
      const saved = parseFloat(goal.saved_amount);
      const remaining = Math.max(target - saved, 0);
      const progress = target > 0 ? Math.round((saved / target) * 100) : 0;

      // Time projection
      const monthsToGoal = avgMonthlySavings > 0
        ? Math.ceil(remaining / avgMonthlySavings)
        : null;

      // Deadline check
      let onTrack = null;
      let daysLeft = null;
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const now = new Date();
        daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        const monthsLeft = daysLeft / 30;
        const neededMonthly = monthsLeft > 0 ? remaining / monthsLeft : remaining;
        onTrack = avgMonthlySavings >= neededMonthly;
      }

      return {
        id: goal.id,
        title: goal.title,
        targetAmount: target,
        savedAmount: saved,
        remaining,
        progress,
        category: goal.category,
        priority: goal.priority,
        status: goal.status,
        deadline: goal.deadline,
        daysLeft,
        onTrack,
        monthsToGoal,
        avgMonthlySavings: Math.round(avgMonthlySavings),
        createdAt: goal.created_at
      };
    });

    const activeGoals = goalsWithStatus.filter(g => g.status === 'active');
    const completedGoals = goalsWithStatus.filter(g => g.status === 'completed');
    const totalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0);
    const totalSaved = activeGoals.reduce((s, g) => s + g.savedAmount, 0);

    res.status(200).json({
      goals: goalsWithStatus,
      summary: {
        activeCount: activeGoals.length,
        completedCount: completedGoals.length,
        totalTarget: Math.round(totalTarget),
        totalSaved: Math.round(totalSaved),
        overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
        avgMonthlySavings: Math.round(avgMonthlySavings)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
