const pool = require('../config/db');

/**
 * Financial Health Score — Gamified (0-100)
 *
 * Components:
 *   Savings Rate       → 0-30 points
 *   Expense Stability  → 0-20 points
 *   Emergency Fund     → 0-20 points
 *   Budget Adherence   → 0-15 points
 *   Income Diversity   → 0-15 points
 */
exports.getHealthScore = async (req, res) => {
  try {
    const userId = req.user.userId;
    const breakdown = [];

    // ── 1. Savings Rate (0-30 pts) ──
    const totals = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount END),0) AS total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) AS total_expense
       FROM transactions WHERE user_id = $1`,
      [userId]
    );
    const totalIncome  = parseFloat(totals.rows[0].total_income);
    const totalExpense = parseFloat(totals.rows[0].total_expense);
    let savingsRate = totalIncome > 0
      ? ((totalIncome - totalExpense) / totalIncome) * 100
      : 0;
    savingsRate = Math.max(savingsRate, 0);

    let savingsScore = 0;
    if (savingsRate >= 30) savingsScore = 30;
    else if (savingsRate >= 20) savingsScore = 25;
    else if (savingsRate >= 10) savingsScore = 18;
    else if (savingsRate >= 5) savingsScore = 10;
    else savingsScore = Math.round(savingsRate);

    breakdown.push({
      label: 'Savings Rate',
      score: savingsScore,
      max: 30,
      detail: `${Math.round(savingsRate)}% of income saved`,
      tip: savingsRate < 20
        ? 'Try to save at least 20% of your income.'
        : 'Great savings discipline!'
    });

    // ── 2. Expense Stability / Consistency (0-20 pts) ──
    const monthlyExp = await pool.query(
      `SELECT TO_CHAR(created_at,'YYYY-MM') AS month,
              SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1 AND type='expense'
       GROUP BY month ORDER BY month`,
      [userId]
    );
    const expAmounts = monthlyExp.rows.map(r => parseFloat(r.total));
    let stabilityScore = 10; // default middle
    if (expAmounts.length >= 2) {
      const mean = expAmounts.reduce((a, b) => a + b, 0) / expAmounts.length;
      const variance = expAmounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / expAmounts.length;
      const cv = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0; // coefficient of variation
      if (cv <= 10) stabilityScore = 20;
      else if (cv <= 20) stabilityScore = 16;
      else if (cv <= 35) stabilityScore = 12;
      else if (cv <= 50) stabilityScore = 8;
      else stabilityScore = 4;
    }
    breakdown.push({
      label: 'Expense Stability',
      score: stabilityScore,
      max: 20,
      detail: expAmounts.length < 2
        ? 'Need more data (at least 2 months)'
        : `Based on ${expAmounts.length} months of spending`,
      tip: stabilityScore < 14
        ? 'Your spending varies a lot month to month. Try to keep it consistent.'
        : 'Your spending is fairly stable. Good control!'
    });

    // ── 3. Emergency Fund (0-20 pts) ──
    const avgMonthlyExpense = expAmounts.length > 0
      ? expAmounts.reduce((a, b) => a + b, 0) / expAmounts.length
      : 0;
    const balance = totalIncome - totalExpense;
    const emergencyMonths = avgMonthlyExpense > 0
      ? balance / avgMonthlyExpense
      : 0;

    let emergencyScore = 0;
    if (emergencyMonths >= 6) emergencyScore = 20;
    else if (emergencyMonths >= 3) emergencyScore = 15;
    else if (emergencyMonths >= 1) emergencyScore = 10;
    else if (emergencyMonths >= 0.5) emergencyScore = 5;
    else emergencyScore = 2;

    breakdown.push({
      label: 'Emergency Fund',
      score: emergencyScore,
      max: 20,
      detail: `Balance covers ~${emergencyMonths.toFixed(1)} months of expenses`,
      tip: emergencyMonths < 3
        ? 'Build an emergency fund of at least 3 months of expenses.'
        : 'Solid emergency cushion!'
    });

    // ── 4. Budget Adherence (0-15 pts) ──
    const budgetResult = await pool.query(
      `SELECT
         b.amount AS budget_amount,
         COALESCE(SUM(
           CASE WHEN TO_CHAR(t.created_at,'YYYY-MM') = TO_CHAR(NOW(),'YYYY-MM')
           THEN t.amount ELSE 0 END
         ),0) AS spent
       FROM budgets b
       LEFT JOIN transactions t
         ON t.user_id = b.user_id AND t.category = b.category AND t.type='expense'
       WHERE b.user_id = $1
       GROUP BY b.id, b.amount`,
      [userId]
    );

    let budgetScore = 10; // default if no budgets
    if (budgetResult.rows.length > 0) {
      const withinBudget = budgetResult.rows.filter(
        r => parseFloat(r.spent) <= parseFloat(r.budget_amount)
      ).length;
      const ratio = withinBudget / budgetResult.rows.length;
      budgetScore = Math.round(ratio * 15);
    }
    breakdown.push({
      label: 'Budget Adherence',
      score: budgetScore,
      max: 15,
      detail: budgetResult.rows.length === 0
        ? 'No budgets set — set budgets to improve this score'
        : `${budgetResult.rows.filter(r => parseFloat(r.spent) <= parseFloat(r.budget_amount)).length}/${budgetResult.rows.length} budgets on track`,
      tip: budgetScore < 10
        ? 'You are exceeding several budgets. Review your spending.'
        : 'Good budget management!'
    });

    // ── 5. Income Consistency (0-15 pts) ──
    const monthlyInc = await pool.query(
      `SELECT TO_CHAR(created_at,'YYYY-MM') AS month,
              SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1 AND type='income'
       GROUP BY month ORDER BY month`,
      [userId]
    );
    const incAmounts = monthlyInc.rows.map(r => parseFloat(r.total));
    let incomeScore = 8;
    if (incAmounts.length >= 2) {
      const mean = incAmounts.reduce((a, b) => a + b, 0) / incAmounts.length;
      const variance = incAmounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / incAmounts.length;
      const cv = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
      if (cv <= 10) incomeScore = 15;
      else if (cv <= 25) incomeScore = 12;
      else if (cv <= 40) incomeScore = 8;
      else incomeScore = 4;
    }
    breakdown.push({
      label: 'Income Consistency',
      score: incomeScore,
      max: 15,
      detail: incAmounts.length < 2
        ? 'Need more data (at least 2 months)'
        : `Based on ${incAmounts.length} months of income`,
      tip: incomeScore < 10
        ? 'Your income fluctuates. Diversify or stabilize income sources.'
        : 'Stable income stream. Keep it up!'
    });

    // ── Total ──
    const totalScore = breakdown.reduce((s, b) => s + b.score, 0);

    let grade = 'F';
    let emoji = '😟';
    if (totalScore >= 85) { grade = 'A+'; emoji = '🏆'; }
    else if (totalScore >= 75) { grade = 'A'; emoji = '🌟'; }
    else if (totalScore >= 65) { grade = 'B+'; emoji = '💪'; }
    else if (totalScore >= 55) { grade = 'B'; emoji = '👍'; }
    else if (totalScore >= 45) { grade = 'C'; emoji = '🔄'; }
    else if (totalScore >= 30) { grade = 'D'; emoji = '⚠️'; }
    else { grade = 'F'; emoji = '😟'; }

    res.status(200).json({
      score: totalScore,
      maxScore: 100,
      grade,
      emoji,
      breakdown,
      message: totalScore >= 70
        ? 'Your financial health is strong! Keep it up.'
        : totalScore >= 45
        ? 'Decent financial health. Focus on improving weaker areas.'
        : 'Needs attention. Follow the tips below to improve.'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
