const pool = require('../config/db');

/**
 * Financial Personality Analyzer
 * Analyzes spending behavior patterns and assigns a personality type.
 *
 * Personality Types:
 *   - Impulse Buyer: Many small, frequent expenses
 *   - Disciplined Saver: Consistently saves 20%+
 *   - Weekend Splurger: Heavy weekend spending
 *   - Emotional Spender: Late-night or inconsistent bursts
 *   - Balanced Planner: Moderate and well-distributed
 *   - Minimalist: Very few expenses, low amounts
 */
exports.getPersonality = async (req, res) => {
  try {
    const userId = req.user.userId;
    const traits = [];
    const warnings = [];

    // ── 1. Weekend vs Weekday spending ──
    const dayPattern = await pool.query(
      `SELECT
         EXTRACT(DOW FROM created_at) AS dow,
         SUM(amount) AS total,
         COUNT(*) AS cnt
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       GROUP BY dow
       ORDER BY dow`,
      [userId]
    );

    let weekdayTotal = 0, weekendTotal = 0;
    let weekdayCount = 0, weekendCount = 0;
    dayPattern.rows.forEach(r => {
      const dow = parseInt(r.dow);
      const total = parseFloat(r.total);
      const cnt = parseInt(r.cnt);
      if (dow === 0 || dow === 6) {
        weekendTotal += total;
        weekendCount += cnt;
      } else {
        weekdayTotal += total;
        weekdayCount += cnt;
      }
    });

    const weekdayAvg = weekdayCount > 0 ? weekdayTotal / 5 : 0;
    const weekendAvg = weekendCount > 0 ? weekendTotal / 2 : 0;
    const weekendRatio = weekdayAvg > 0 ? (weekendAvg / weekdayAvg) : 1;

    if (weekendRatio > 1.5) {
      traits.push({
        trait: 'Weekend Splurger',
        strength: Math.min(Math.round((weekendRatio - 1) * 100), 100),
        description: `You spend ${Math.round((weekendRatio - 1) * 100)}% more per day on weekends than weekdays.`
      });
      warnings.push(`Weekend spending is ${Math.round((weekendRatio - 1) * 100)}% higher than weekday average. Consider setting a weekend budget.`);
    }

    // ── 2. Impulse buying detection (many small transactions) ──
    const txnSizePattern = await pool.query(
      `SELECT
         COUNT(*) AS total_count,
         COUNT(CASE WHEN amount < 200 THEN 1 END) AS small_count,
         AVG(amount) AS avg_amount
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'`,
      [userId]
    );

    const totalCount = parseInt(txnSizePattern.rows[0].total_count) || 0;
    const smallCount = parseInt(txnSizePattern.rows[0].small_count) || 0;
    const smallRatio = totalCount > 0 ? smallCount / totalCount : 0;

    if (smallRatio > 0.6 && totalCount >= 5) {
      traits.push({
        trait: 'Impulse Buyer',
        strength: Math.round(smallRatio * 100),
        description: `${Math.round(smallRatio * 100)}% of your expenses are small purchases (<₹200). These add up fast.`
      });
      warnings.push('Many small purchases detected. These micro-expenses can silently drain your budget.');
    }

    // ── 3. Savings behavior ──
    const savingsData = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount END),0) AS inc,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) AS exp
       FROM transactions WHERE user_id = $1`,
      [userId]
    );
    const inc = parseFloat(savingsData.rows[0].inc);
    const exp = parseFloat(savingsData.rows[0].exp);
    const savingsRate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;

    if (savingsRate >= 25) {
      traits.push({
        trait: 'Disciplined Saver',
        strength: Math.min(Math.round(savingsRate), 100),
        description: `You save ${Math.round(savingsRate)}% of your income. Excellent discipline.`
      });
    } else if (savingsRate < 5 && inc > 0) {
      traits.push({
        trait: 'Living on the Edge',
        strength: Math.round(100 - savingsRate),
        description: `Only ${Math.round(savingsRate)}% savings rate. You're spending almost everything you earn.`
      });
      warnings.push('Your savings rate is dangerously low. Even saving 10% can make a big difference.');
    }

    // ── 4. Late-night spending (emotional pattern) ──
    const timePattern = await pool.query(
      `SELECT
         EXTRACT(HOUR FROM created_at) AS hr,
         SUM(amount) AS total,
         COUNT(*) AS cnt
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       GROUP BY hr ORDER BY hr`,
      [userId]
    );

    let lateNightTotal = 0, lateNightCount = 0, dayTimeTotal = 0;
    timePattern.rows.forEach(r => {
      const hr = parseInt(r.hr);
      const total = parseFloat(r.total);
      const cnt = parseInt(r.cnt);
      if (hr >= 22 || hr <= 4) {
        lateNightTotal += total;
        lateNightCount += cnt;
      } else {
        dayTimeTotal += total;
      }
    });

    const lateNightRatio = (lateNightTotal + dayTimeTotal) > 0
      ? lateNightTotal / (lateNightTotal + dayTimeTotal)
      : 0;

    if (lateNightRatio > 0.15 && lateNightCount >= 3) {
      traits.push({
        trait: 'Emotional Spender',
        strength: Math.round(lateNightRatio * 100),
        description: `${Math.round(lateNightRatio * 100)}% of your spending happens late at night (10PM-4AM). This often indicates emotional spending.`
      });
      warnings.push('Late-night spending detected. Try waiting 24 hours before making impulsive purchases.');
    }

    // ── 5. Category concentration ──
    const catDist = await pool.query(
      `SELECT category, SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense' AND category IS NOT NULL
       GROUP BY category ORDER BY total DESC`,
      [userId]
    );

    if (catDist.rows.length > 0) {
      const catTotal = catDist.rows.reduce((s, r) => s + parseFloat(r.total), 0);
      const topCatRatio = catTotal > 0 ? parseFloat(catDist.rows[0].total) / catTotal : 0;

      if (topCatRatio > 0.5) {
        traits.push({
          trait: 'Category Obsessed',
          strength: Math.round(topCatRatio * 100),
          description: `${Math.round(topCatRatio * 100)}% of expenses go to "${catDist.rows[0].category}". Consider diversifying.`
        });
      }
    }

    // ── 6. Spending spike detection ──
    const monthlySpend = await pool.query(
      `SELECT TO_CHAR(created_at,'YYYY-MM') AS month, SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1 AND type='expense'
       GROUP BY month ORDER BY month`,
      [userId]
    );
    const monthAmts = monthlySpend.rows.map(r => parseFloat(r.total));

    if (monthAmts.length >= 3) {
      const avg = monthAmts.reduce((a, b) => a + b, 0) / monthAmts.length;
      const lastMonth = monthAmts[monthAmts.length - 1];
      if (lastMonth > avg * 1.4) {
        warnings.push(`Your most recent month's spending is ${Math.round(((lastMonth - avg) / avg) * 100)}% above your average. Check if this is a one-time spike or a trend.`);
      }
    }

    // ── Determine primary personality ──
    let primaryPersonality = { trait: 'Balanced Planner', emoji: '⚖️' };
    if (traits.length > 0) {
      traits.sort((a, b) => b.strength - a.strength);
      const top = traits[0].trait;
      const emojiMap = {
        'Weekend Splurger': '🎉',
        'Impulse Buyer': '🛒',
        'Disciplined Saver': '🏦',
        'Living on the Edge': '🎲',
        'Emotional Spender': '🌙',
        'Category Obsessed': '🎯'
      };
      primaryPersonality = { trait: top, emoji: emojiMap[top] || '📊' };
    }

    if (totalCount < 5) {
      primaryPersonality = { trait: 'New User', emoji: '🌱' };
    }

    res.status(200).json({
      personality: primaryPersonality,
      traits,
      warnings,
      stats: {
        totalTransactions: totalCount,
        savingsRate: Math.round(savingsRate),
        weekendRatio: Math.round(weekendRatio * 100),
        lateNightPercent: Math.round(lateNightRatio * 100)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * Emotional Spending Detection
 * Detects patterns: late-night, post-weekend, keyword analysis in titles
 */
exports.getEmotionalPatterns = async (req, res) => {
  try {
    const userId = req.user.userId;
    const patterns = [];

    // 1. Late-night spending pattern
    const lateNight = await pool.query(
      `SELECT title, amount, category,
              TO_CHAR(created_at, 'HH24:MI') AS time,
              TO_CHAR(created_at, 'YYYY-MM-DD') AS date
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
         AND (EXTRACT(HOUR FROM created_at) >= 22 OR EXTRACT(HOUR FROM created_at) <= 4)
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    if (lateNight.rows.length >= 2) {
      const totalAmt = lateNight.rows.reduce((s, r) => s + parseFloat(r.amount), 0);
      patterns.push({
        type: 'late_night',
        icon: '🌙',
        title: 'Late Night Spending',
        description: `${lateNight.rows.length} purchases made between 10PM–4AM totalling ₹${Math.round(totalAmt)}`,
        severity: lateNight.rows.length >= 5 ? 'high' : 'medium',
        transactions: lateNight.rows.slice(0, 5)
      });
    }

    // 2. Weekend surge
    const weekendSurge = await pool.query(
      `SELECT
         COALESCE(AVG(CASE WHEN EXTRACT(DOW FROM created_at) IN (0,6) THEN amount END),0) AS weekend_avg,
         COALESCE(AVG(CASE WHEN EXTRACT(DOW FROM created_at) NOT IN (0,6) THEN amount END),0) AS weekday_avg
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'`,
      [userId]
    );

    const wkendAvg = parseFloat(weekendSurge.rows[0].weekend_avg);
    const wkdayAvg = parseFloat(weekendSurge.rows[0].weekday_avg);

    if (wkdayAvg > 0 && wkendAvg > wkdayAvg * 1.3) {
      patterns.push({
        type: 'weekend_surge',
        icon: '📅',
        title: 'Weekend Spending Surge',
        description: `Average weekend purchase (₹${Math.round(wkendAvg)}) is ${Math.round(((wkendAvg - wkdayAvg) / wkdayAvg) * 100)}% higher than weekday (₹${Math.round(wkdayAvg)})`,
        severity: wkendAvg > wkdayAvg * 2 ? 'high' : 'medium'
      });
    }

    // 3. Keyword detection in titles (emotional indicators)
    const emotionalKeywords = ['stress', 'treat', 'impulse', 'late night', 'bored',
      'sad', 'happy', 'celebration', 'reward', 'comfort', 'craving', 'splurge', 'yolo'];

    const keywordQuery = emotionalKeywords
      .map((_, i) => `LOWER(title) LIKE $${i + 2}`)
      .join(' OR ');

    const emotionalTxns = await pool.query(
      `SELECT title, amount, category, TO_CHAR(created_at, 'YYYY-MM-DD') AS date
       FROM transactions
       WHERE user_id = $1 AND type = 'expense' AND (${keywordQuery})
       ORDER BY created_at DESC LIMIT 10`,
      [userId, ...emotionalKeywords.map(k => `%${k}%`)]
    );

    if (emotionalTxns.rows.length > 0) {
      patterns.push({
        type: 'emotional_keywords',
        icon: '💭',
        title: 'Emotional Spending Signals',
        description: `${emotionalTxns.rows.length} transactions contain emotional keywords in their titles`,
        severity: emotionalTxns.rows.length >= 5 ? 'high' : 'low',
        transactions: emotionalTxns.rows.slice(0, 5)
      });
    }

    // 4. Spending burst detection (many transactions in short period)
    const burstDays = await pool.query(
      `SELECT
         TO_CHAR(created_at, 'YYYY-MM-DD') AS day,
         COUNT(*) AS cnt,
         SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       GROUP BY day
       HAVING COUNT(*) >= 4
       ORDER BY cnt DESC LIMIT 5`,
      [userId]
    );

    if (burstDays.rows.length > 0) {
      patterns.push({
        type: 'spending_burst',
        icon: '⚡',
        title: 'Spending Bursts Detected',
        description: `${burstDays.rows.length} days with 4+ transactions. High-spending days: ${burstDays.rows.map(r => `${r.day} (₹${Math.round(parseFloat(r.total))})`).join(', ')}`,
        severity: 'medium'
      });
    }

    // Overall emotional spending score (0-100, higher = more emotional)
    let emotionalScore = 0;
    patterns.forEach(p => {
      if (p.severity === 'high') emotionalScore += 30;
      else if (p.severity === 'medium') emotionalScore += 20;
      else emotionalScore += 10;
    });
    emotionalScore = Math.min(emotionalScore, 100);

    res.status(200).json({
      emotionalScore,
      patterns,
      advice: emotionalScore >= 50
        ? 'Your spending shows strong emotional patterns. Try the 24-hour rule: wait a day before non-essential purchases.'
        : emotionalScore >= 25
        ? 'Some emotional spending detected. Be mindful of triggers like late nights or weekends.'
        : 'Your spending appears rational and well-controlled. Keep it up!'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
