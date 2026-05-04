/**
 * MoniqoFi Demo Data Seed Script
 * Populates the database with realistic demo data for presentations
 * Run: node seed-demo-data.js
 */

require('dotenv').config();
const pool = require('./src/config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (color, text) => console.log(`${color}${text}${colors.reset}`);

// Demo user data
const demoUsers = [
  {
    name: 'Priya Sharma',
    email: 'priya@moniqofi.com',
    password: 'Demo@123',
  },
  {
    name: 'Raj Patel',
    email: 'raj@moniqofi.com',
    password: 'Demo@123',
  },
  {
    name: 'Anaya Kumar',
    email: 'anaya@moniqofi.com',
    password: 'Demo@123',
  },
];

// Realistic transaction categories and patterns
const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health & Medical',
  'Education',
  'Subscriptions',
  'Insurance',
  'Rent & Housing',
];

const incomeCategories = [
  'Salary',
  'Freelance',
  'Investment Returns',
  'Bonus',
  'Side Gig',
];

// Generate realistic transactions for a user
const generateTransactions = (userId, months = 12) => {
  const transactions = [];
  const now = new Date();
  
  // Income transactions (monthly salary + occasional bonuses)
  for (let m = months; m >= 0; m--) {
    const date = new Date(now.getFullYear(), now.getMonth() - m, Math.floor(Math.random() * 28) + 1);
    
    // Monthly salary
    transactions.push({
      user_id: userId,
      title: 'Salary',
      amount: 150000 + Math.random() * 30000,
      type: 'income',
      category: 'Salary',
      created_at: date,
    });

    // Occasional bonus
    if (Math.random() > 0.7) {
      transactions.push({
        user_id: userId,
        title: 'Performance Bonus',
        amount: 50000 + Math.random() * 50000,
        type: 'income',
        category: 'Bonus',
        created_at: new Date(date.getTime() + Math.random() * 86400000),
      });
    }
  }

  // Daily/weekly expenses
  const expensePatterns = {
    'Food & Dining': [
      { title: 'Swiggy', min: 300, max: 800 },
      { title: 'Starbucks', min: 200, max: 400 },
      { title: 'Restaurant Dinner', min: 1000, max: 3000 },
      { title: 'Grocery Shopping', min: 1500, max: 4000 },
      { title: 'Zomato', min: 400, max: 1200 },
    ],
    'Transportation': [
      { title: 'Uber', min: 150, max: 500 },
      { title: 'Petrol', min: 2000, max: 3000 },
      { title: 'Auto Rickshaw', min: 50, max: 200 },
      { title: 'Metro Pass', min: 500, max: 1000 },
    ],
    'Shopping': [
      { title: 'Amazon', min: 500, max: 5000 },
      { title: 'Flipkart', min: 400, max: 4000 },
      { title: 'Clothing Store', min: 1000, max: 5000 },
      { title: 'Phone Accessories', min: 500, max: 2000 },
    ],
    'Entertainment': [
      { title: 'Netflix', min: 149, max: 499 },
      { title: 'Movie Tickets', min: 300, max: 600 },
      { title: 'Concert', min: 2000, max: 5000 },
      { title: 'Gaming', min: 1000, max: 3000 },
    ],
    'Utilities': [
      { title: 'Electricity Bill', min: 2000, max: 3500 },
      { title: 'Water Bill', min: 500, max: 1200 },
      { title: 'Internet', min: 800, max: 1500 },
      { title: 'Mobile Bill', min: 400, max: 800 },
    ],
    'Health & Medical': [
      { title: 'Gym Membership', min: 1500, max: 3000 },
      { title: 'Medical Consultation', min: 500, max: 2000 },
      { title: 'Pharmacy', min: 200, max: 1500 },
      { title: 'Health Insurance', min: 5000, max: 15000 },
    ],
    'Subscriptions': [
      { title: 'Spotify', min: 99, max: 199 },
      { title: 'Kindle', min: 99, max: 299 },
      { title: 'Gym App', min: 99, max: 999 },
      { title: 'Cloud Storage', min: 200, max: 500 },
    ],
  };

  // Generate 150+ transactions spread across the year
  for (let i = 0; i < 150; i++) {
    const randomMonth = Math.floor(Math.random() * months);
    const randomDay = Math.floor(Math.random() * 28) + 1;
    const date = new Date(now.getFullYear(), now.getMonth() - randomMonth, randomDay);
    
    const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    const patterns = expensePatterns[category] || [{ title: category, min: 100, max: 5000 }];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    transactions.push({
      user_id: userId,
      title: pattern.title,
      amount: Math.round(pattern.min + Math.random() * (pattern.max - pattern.min)),
      type: 'expense',
      category: category,
      created_at: date,
    });
  }

  return transactions;
};

// Generate budget data
const generateBudgets = (userId) => {
  return expenseCategories.map(category => ({
    user_id: userId,
    category: category,
    amount: Math.round(5000 + Math.random() * 30000),
  }));
};

// Generate goals data
const generateGoals = (userId) => {
  const goalTemplates = [
    { title: 'Emergency Fund', target: 500000 },
    { title: 'Vacation Fund', target: 200000 },
    { title: 'Car Down Payment', target: 1000000 },
    { title: 'House Down Payment', target: 5000000 },
    { title: 'Wedding Fund', target: 1500000 },
    { title: 'Education Fund', target: 300000 },
    { title: 'Retirement Savings', target: 10000000 },
    { title: 'New MacBook Pro', target: 150000 },
    { title: 'Investment Portfolio', target: 1000000 },
    { title: 'Annual Gadget Fund', target: 100000 },
  ];

  return goalTemplates.map((goal, idx) => ({
    user_id: userId,
    title: goal.title,
    target_amount: goal.target,
    saved_amount: Math.floor(goal.target * Math.random() * 0.7),
    deadline: new Date(new Date().getFullYear() + Math.floor(idx / 3) + 1, Math.random() * 12, 28),
    category: 'Savings',
    priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
  }));
};

// Ensure tables exist
const ensureTables = async () => {
  log(colors.cyan, '\n📋 Creating/verifying tables...');
  
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_token_expiry TIMESTAMPTZ,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log(colors.green, '✓ Users table ready');

    // Transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        source VARCHAR(50) DEFAULT 'manual',
        plaid_transaction_id TEXT UNIQUE,
        linked_account_id INTEGER,
        merchant_name VARCHAR(255),
        pending BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log(colors.green, '✓ Transactions table ready');

    // Budgets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, category)
      )
    `);
    log(colors.green, '✓ Budgets table ready');

    // Goals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    log(colors.green, '✓ Goals table ready');

  } catch (error) {
    log(colors.yellow, `⚠ Table creation warning: ${error.message}`);
  }
};

// Insert users
const insertUsers = async () => {
  log(colors.cyan, '\n👥 Creating demo users...');
  
  const insertedUsers = [];
  
  for (const user of demoUsers) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const result = await pool.query(
        `INSERT INTO users (name, email, password, email_verified)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (email) DO UPDATE SET password = $3
         RETURNING id, name, email`,
        [user.name, user.email, hashedPassword]
      );
      insertedUsers.push(result.rows[0]);
      log(colors.green, `✓ User: ${user.email} (Password: Demo@123)`);
    } catch (error) {
      log(colors.yellow, `⚠ User ${user.email}: ${error.message}`);
    }
  }
  
  return insertedUsers;
};

// Insert transactions using batch
const insertTransactions = async (users) => {
  log(colors.cyan, '\n💰 Inserting transactions...');
  
  let totalInserted = 0;
  
  for (const user of users) {
    try {
      const transactions = generateTransactions(user.id);
      
      // Batch insert (faster than individual queries)
      const values = [];
      let placeholders = [];
      let paramIndex = 1;
      
      for (const txn of transactions) {
        placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
        values.push(txn.user_id, txn.title, txn.amount, txn.type, txn.category, txn.created_at);
        paramIndex += 6;
      }
      
      if (placeholders.length > 0) {
        const query = `INSERT INTO transactions (user_id, title, amount, type, category, created_at) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`;
        await pool.query(query, values);
        totalInserted += transactions.length;
      }
      
      log(colors.green, `✓ ${transactions.length} transactions for ${user.email}`);
    } catch (error) {
      log(colors.yellow, `⚠ Transactions for ${user.email}: ${error.message}`);
    }
  }
  
  log(colors.blue, `📊 Total transactions inserted: ${totalInserted}`);
};

// Insert budgets using batch
const insertBudgets = async (users) => {
  log(colors.cyan, '\n📌 Creating budgets...');
  
  for (const user of users) {
    try {
      const budgets = generateBudgets(user.id);
      
      // Batch insert
      const values = [];
      let placeholders = [];
      let paramIndex = 1;
      
      for (const budget of budgets) {
        placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
        values.push(budget.user_id, budget.category, budget.amount);
        paramIndex += 3;
      }
      
      if (placeholders.length > 0) {
        const query = `INSERT INTO budgets (user_id, category, amount) VALUES ${placeholders.join(', ')} ON CONFLICT (user_id, category) DO UPDATE SET amount = EXCLUDED.amount`;
        await pool.query(query, values);
      }
      
      log(colors.green, `✓ ${budgets.length} budgets for ${user.email}`);
    } catch (error) {
      log(colors.yellow, `⚠ Budgets for ${user.email}: ${error.message}`);
    }
  }
};

// Insert goals using batch
const insertGoals = async (users) => {
  log(colors.cyan, '\n🎯 Creating financial goals...');
  
  for (const user of users) {
    try {
      const goals = generateGoals(user.id);
      
      // Batch insert
      const values = [];
      let placeholders = [];
      let paramIndex = 1;
      
      for (const goal of goals) {
        placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`);
        values.push(goal.user_id, goal.title, goal.target_amount, goal.saved_amount, goal.deadline, goal.category, goal.priority);
        paramIndex += 7;
      }
      
      if (placeholders.length > 0) {
        const query = `INSERT INTO goals (user_id, title, target_amount, saved_amount, deadline, category, priority) VALUES ${placeholders.join(', ')}`;
        await pool.query(query, values);
      }
      
      log(colors.green, `✓ ${goals.length} goals for ${user.email}`);
    } catch (error) {
      log(colors.yellow, `⚠ Goals for ${user.email}: ${error.message}`);
    }
  }
};

// Main seeding function
const seed = async () => {
  log(colors.bright + colors.cyan, '\n🌱 MoniqoFi Demo Data Seeder\n');
  
  try {
    await ensureTables();
    const users = await insertUsers();
    
    if (users.length === 0) {
      log(colors.yellow, '⚠ No users created, skipping data insertion');
      process.exit(0);
    }
    
    await insertTransactions(users);
    await insertBudgets(users);
    await insertGoals(users);
    
    log(colors.bright + colors.green, '\n✅ Database seeded successfully!\n');
    log(colors.cyan, '📝 Demo Users:');
    demoUsers.forEach(user => {
      log(colors.yellow, `   Email: ${user.email}`);
      log(colors.yellow, `   Password: ${user.password}`);
      log(colors.yellow, '   ---');
    });
    
    log(colors.bright + colors.blue, '\n🚀 You can now log in and see all the demo data!\n');
    
  } catch (error) {
    log(colors.bright + '\x1b[31m', `\n❌ Seeding failed: ${error.message}\n`);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run seeding
seed();
