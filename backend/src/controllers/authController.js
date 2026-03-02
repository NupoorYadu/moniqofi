const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      // If they exist but haven't verified, let them re-register (update & resend)
      if (!existing.email_verified) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await pool.query(
          "UPDATE users SET name = $1, password = $2, verification_token = $3, verification_token_expiry = $4 WHERE email = $5",
          [name, hashedPassword, verificationToken, tokenExpiry, email]
        );

        const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
          from: `"MoniqoFi" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Verify Your Email - MoniqoFi",
          html: buildVerificationEmail(name, verifyLink),
        });

        return res.status(201).json({
          message: "Verification email sent. Please check your inbox.",
          requiresVerification: true,
        });
      }
      return res.status(400).json({ message: "User already exists" });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 5. Insert new user (unverified)
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, email_verified, verification_token, verification_token_expiry) VALUES ($1, $2, $3, FALSE, $4, $5) RETURNING id, name, email",
      [name, email, hashedPassword, verificationToken, tokenExpiry]
    );

    // 6. Send verification email
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: `"MoniqoFi" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - MoniqoFi",
      html: buildVerificationEmail(name, verifyLink),
    });

    res.status(201).json({
      message: "Account created! Please check your email to verify.",
      requiresVerification: true,
      user: newUser.rows[0],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // Block unverified accounts
    if (!user.email_verified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        requiresVerification: true,
        email: user.email,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//Add Forgot Password Controller
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [resetToken, expiry, email]
    );

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"MoniqoFi" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset - MoniqoFi",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>You requested a password reset for your MoniqoFi account.</p>
          <p>Click the button below to set a new password. This link expires in 15 minutes.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
          <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({
      message: "Password reset link sent to your email"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//Add Reset Password Controller
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password required" });
    }

    const userResult = await pool.query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = userResult.rows[0];

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Verify Email ───
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const userResult = await pool.query(
      "SELECT * FROM users WHERE verification_token = $1 AND verification_token_expiry > NOW()",
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired verification link" });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(200).json({ message: "Email already verified", alreadyVerified: true });
    }

    await pool.query(
      "UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expiry = NULL WHERE id = $1",
      [user.id]
    );

    // Generate JWT so user is auto-logged in after verification
    const jwtToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Email verified successfully!",
      token: jwtToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Resend Verification Email ───
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      "UPDATE users SET verification_token = $1, verification_token_expiry = $2 WHERE email = $3",
      [verificationToken, tokenExpiry, email]
    );

    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: `"MoniqoFi" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - MoniqoFi",
      html: buildVerificationEmail(user.name, verifyLink),
    });

    res.status(200).json({ message: "Verification email resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Email HTML Template ───
function buildVerificationEmail(name, verifyLink) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #0A0A0A; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #E50914 0%, #B20710 100%); padding: 40px 32px; text-align: center;">
        <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">
          Moniqo<span style="font-weight: 400;">Fi</span>
        </h1>
        <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 6px; letter-spacing: 2px; text-transform: uppercase;">
          Smart Finance, Smarter You
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 40px 32px;">
        <h2 style="color: #fff; font-size: 22px; margin: 0 0 8px;">
          Welcome, ${name}!
        </h2>
        <p style="color: #888; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
          Thanks for creating your MoniqoFi account. Please verify your email address to get started with AI-powered financial insights.
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyLink}"
             style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #E50914, #B20710); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
            Verify My Email
          </a>
        </div>

        <p style="color: #666; font-size: 13px; line-height: 1.6;">
          This link expires in <strong style="color: #aaa;">24 hours</strong>. If you didn't create this account, you can safely ignore this email.
        </p>

        <!-- Divider -->
        <hr style="border: none; border-top: 1px solid #222; margin: 28px 0;" />

        <p style="color: #555; font-size: 12px; text-align: center; margin: 0;">
          Having trouble? Copy and paste this link into your browser:<br/>
          <a href="${verifyLink}" style="color: #E50914; word-break: break-all; font-size: 11px;">${verifyLink}</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="padding: 20px 32px; background: #111; text-align: center;">
        <p style="color: #444; font-size: 11px; margin: 0;">
          &copy; ${new Date().getFullYear()} MoniqoFi — AI-Powered Personal Finance
        </p>
      </div>
    </div>
  `;
}