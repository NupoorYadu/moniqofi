const pool = require('../config/db');

/**
 * Subscription Leak Detector
 * Detects recurring payments and calculates "silent money leak" score.
 *
 * Detection logic:
 * - Same amount + same category appearing 2+ times monthly
 * - Title similarity matching
 * - Flags subscriptions with yearly cost projection
 */
exports.detectSubscriptions = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find recurring patterns: same amount + similar title appearing in multiple months
    const recurring = await pool.query(
      `WITH monthly_txns AS (
         SELECT
           title,
           amount,
           category,
           TO_CHAR(created_at, 'YYYY-MM') AS month,
           created_at
         FROM transactions
         WHERE user_id = $1 AND type = 'expense'
       ),
       recurring_patterns AS (
         SELECT
           LOWER(TRIM(title)) AS norm_title,
           amount,
           category,
           COUNT(DISTINCT month) AS months_appearing,
           MIN(created_at) AS first_seen,
           MAX(created_at) AS last_seen,
           ARRAY_AGG(DISTINCT month ORDER BY month) AS months
         FROM monthly_txns
         GROUP BY LOWER(TRIM(title)), amount, category
         HAVING COUNT(DISTINCT month) >= 2
       )
       SELECT *,
         amount * 12 AS yearly_cost,
         amount * months_appearing AS total_spent
       FROM recurring_patterns
       ORDER BY yearly_cost DESC`,
      [userId]
    );

    // Also detect same-amount recurring (title may vary)
    const sameAmount = await pool.query(
      `WITH monthly_amounts AS (
         SELECT
           amount,
           category,
           TO_CHAR(created_at, 'YYYY-MM') AS month,
           ARRAY_AGG(title ORDER BY created_at DESC) AS titles
         FROM transactions
         WHERE user_id = $1 AND type = 'expense'
         GROUP BY amount, category, TO_CHAR(created_at, 'YYYY-MM')
       )
       SELECT
         amount,
         category,
         COUNT(*) AS months_appearing,
         ARRAY_AGG(DISTINCT (titles[1])) AS sample_titles
       FROM monthly_amounts
       GROUP BY amount, category
       HAVING COUNT(*) >= 2 AND amount >= 50
       ORDER BY amount * COUNT(*) DESC`,
      [userId]
    );

    const subscriptions = [];
    const seen = new Set();

    // Process exact title+amount matches
    recurring.rows.forEach(r => {
      const key = `${r.norm_title}-${r.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        subscriptions.push({
          title: r.norm_title,
          amount: parseFloat(r.amount),
          category: r.category,
          monthsDetected: parseInt(r.months_appearing),
          yearlyCost: parseFloat(r.yearly_cost),
          totalSpent: parseFloat(r.total_spent),
          firstSeen: r.first_seen,
          lastSeen: r.last_seen,
          months: r.months,
          confidence: 'high'
        });
      }
    });

    // Process same-amount patterns
    sameAmount.rows.forEach(r => {
      const key = `amount-${r.amount}-${r.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        subscriptions.push({
          title: r.sample_titles[0] || 'Unknown',
          amount: parseFloat(r.amount),
          category: r.category,
          monthsDetected: parseInt(r.months_appearing),
          yearlyCost: parseFloat(r.amount) * 12,
          totalSpent: parseFloat(r.amount) * parseInt(r.months_appearing),
          confidence: 'medium'
        });
      }
    });

    // Calculate totals
    const totalMonthlyLeak = subscriptions.reduce((s, sub) => s + sub.amount, 0);
    const totalYearlyLeak  = subscriptions.reduce((s, sub) => s + sub.yearlyCost, 0);

    // Silent Money Leak Score (0-100)
    const totalMonthlyExpense = await pool.query(
      `SELECT COALESCE(AVG(monthly_total), 0) AS avg_monthly
       FROM (
         SELECT SUM(amount) AS monthly_total
         FROM transactions
         WHERE user_id = $1 AND type = 'expense'
         GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ) sub`,
      [userId]
    );

    const avgMonthly = parseFloat(totalMonthlyExpense.rows[0].avg_monthly) || 1;
    const leakPercent = (totalMonthlyLeak / avgMonthly) * 100;
    const leakScore = Math.min(Math.round(leakPercent * 2), 100);

    res.status(200).json({
      subscriptions,
      summary: {
        totalSubscriptions: subscriptions.length,
        monthlyTotal: Math.round(totalMonthlyLeak),
        yearlyTotal: Math.round(totalYearlyLeak),
        leakScore,
        leakPercent: Math.round(leakPercent)
      },
      advice: leakScore >= 50
        ? `You're spending ₹${Math.round(totalYearlyLeak)} yearly on recurring expenses. Review each subscription — cancel what you don't actively use.`
        : leakScore >= 20
        ? `₹${Math.round(totalYearlyLeak)}/year in recurring costs. Some might be unnecessary.`
        : 'Your recurring expenses look well-managed.'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
