const pool = require('../config/db');

/**
 * "Future You" Simulation Engine
 *
 * Simulates financial future based on current patterns + user inputs.
 * Uses compound growth: FV = P(1 + r)^n
 * Provides current path vs optimized path comparison.
 */

// POST /api/simulation/project
exports.projectFuture = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      monthlyIncome,     // optional override
      monthlySavings,    // optional override
      investmentReturn,  // annual % (e.g. 12)
      years              // projection period
    } = req.body;

    if (!years || years < 1 || years > 30) {
      return res.status(400).json({ message: "Years must be between 1 and 30" });
    }

    // Get actual data from transactions
    const actual = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount END),0) AS total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) AS total_expense,
         COUNT(DISTINCT TO_CHAR(created_at,'YYYY-MM')) AS months_active
       FROM transactions WHERE user_id = $1`,
      [userId]
    );

    const totalIncome  = parseFloat(actual.rows[0].total_income);
    const totalExpense = parseFloat(actual.rows[0].total_expense);
    const monthsActive = parseInt(actual.rows[0].months_active) || 1;

    const avgMonthlyIncome  = monthlyIncome  || (totalIncome / monthsActive);
    const avgMonthlyExpense = totalExpense / monthsActive;
    const currentMonthlySavings = monthlySavings || (avgMonthlyIncome - avgMonthlyExpense);
    const currentBalance = totalIncome - totalExpense;

    const annualReturn = (investmentReturn || 8) / 100; // default 8% p.a.
    const monthlyReturn = annualReturn / 12;

    // ── Current Path Projection ──
    const currentPath = [];
    let currentAmount = Math.max(currentBalance, 0);
    for (let y = 0; y <= years; y++) {
      currentPath.push({
        year: y,
        amount: Math.round(currentAmount)
      });
      // Add 12 months of savings with monthly compounding
      for (let m = 0; m < 12; m++) {
        currentAmount = currentAmount * (1 + monthlyReturn) + currentMonthlySavings;
      }
    }

    // ── Optimized Path (10% expense reduction) ──
    const optimizedSavings = currentMonthlySavings + (avgMonthlyExpense * 0.1);
    const optimizedPath = [];
    let optimizedAmount = Math.max(currentBalance, 0);
    for (let y = 0; y <= years; y++) {
      optimizedPath.push({
        year: y,
        amount: Math.round(optimizedAmount)
      });
      for (let m = 0; m < 12; m++) {
        optimizedAmount = optimizedAmount * (1 + monthlyReturn) + optimizedSavings;
      }
    }

    // ── Aggressive Path (20% expense reduction + 12% returns) ──
    const aggressiveSavings = currentMonthlySavings + (avgMonthlyExpense * 0.2);
    const aggressiveMonthlyReturn = 0.12 / 12;
    const aggressivePath = [];
    let aggressiveAmount = Math.max(currentBalance, 0);
    for (let y = 0; y <= years; y++) {
      aggressivePath.push({
        year: y,
        amount: Math.round(aggressiveAmount)
      });
      for (let m = 0; m < 12; m++) {
        aggressiveAmount = aggressiveAmount * (1 + aggressiveMonthlyReturn) + aggressiveSavings;
      }
    }

    // ── Key Milestones ──
    const milestones = [];
    const targets = [100000, 500000, 1000000, 5000000, 10000000];
    targets.forEach(target => {
      let amt = Math.max(currentBalance, 0);
      for (let m = 1; m <= years * 12; m++) {
        amt = amt * (1 + monthlyReturn) + currentMonthlySavings;
        if (amt >= target) {
          milestones.push({
            target,
            label: target >= 10000000 ? '₹1 Cr' : target >= 100000 ? `₹${target / 100000}L` : `₹${target / 1000}K`,
            monthsToReach: m,
            yearsToReach: (m / 12).toFixed(1)
          });
          break;
        }
      }
    });

    // ── What-If Scenarios ──
    const whatIf = [];

    // What if you save 10% more
    const extra10 = avgMonthlyExpense * 0.1;
    whatIf.push({
      scenario: `Reduce expenses by 10% (save ₹${Math.round(extra10)}/month more)`,
      extraSavings: Math.round(extra10 * 12 * years),
      projectedGain: Math.round(optimizedPath[years].amount - currentPath[years].amount)
    });

    // What if you increase income by 20%
    const extraIncome20 = avgMonthlyIncome * 0.2;
    let incPath = Math.max(currentBalance, 0);
    for (let m = 0; m < years * 12; m++) {
      incPath = incPath * (1 + monthlyReturn) + (currentMonthlySavings + extraIncome20);
    }
    whatIf.push({
      scenario: `Increase income by 20% (₹${Math.round(extraIncome20)}/month more)`,
      extraSavings: Math.round(extraIncome20 * 12 * years),
      projectedGain: Math.round(incPath - currentPath[years].amount)
    });

    res.status(200).json({
      inputs: {
        monthlyIncome: Math.round(avgMonthlyIncome),
        monthlyExpense: Math.round(avgMonthlyExpense),
        monthlySavings: Math.round(currentMonthlySavings),
        annualReturn: annualReturn * 100,
        years,
        currentBalance: Math.round(currentBalance)
      },
      projections: {
        currentPath,
        optimizedPath,
        aggressivePath
      },
      finalAmounts: {
        current: currentPath[years].amount,
        optimized: optimizedPath[years].amount,
        aggressive: aggressivePath[years].amount
      },
      milestones,
      whatIf
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
