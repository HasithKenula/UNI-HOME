// ============================================================================
// Email Utility - Nodemailer Helper Functions
// ============================================================================

import nodemailer from 'nodemailer';

let cachedTransporter = null;
let usingDevFallback = false;

const allowEtherealFallback = () =>
  String(process.env.ALLOW_ETHEREAL_FALLBACK || '').trim().toLowerCase() === 'true';

const hasRealEmailConfig = () => {
  const host = String(process.env.EMAIL_HOST || '').trim();
  const user = String(process.env.EMAIL_USER || '').trim();
  const pass = String(process.env.EMAIL_PASS || '').trim();

  if (!host || !user || !pass) return false;
  if (user === 'your_email@gmail.com') return false;
  if (pass === 'your_app_specific_password') return false;

  return true;
};

/**
 * Create reusable transporter
 */
const createTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  if (hasRealEmailConfig()) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    return cachedTransporter;
  }

  if (!allowEtherealFallback()) {
    throw new Error('Email service is not configured. Set real EMAIL_HOST, EMAIL_USER and EMAIL_PASS values in server/.env. For Gmail, use an App Password (not your account password).');
  }

  const testAccount = await nodemailer.createTestAccount();
  usingDevFallback = true;

  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.warn('⚠️ Email config missing. Using Ethereal test inbox for development.');
  console.warn(`📨 Ethereal user: ${testAccount.user}`);

  return cachedTransporter;
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
const sendEmail = async (options) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@unihome.local',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    console.log(`✅ Email sent: ${info.messageId}`);
    if (usingDevFallback && previewUrl) {
      console.log(`🔍 Preview email URL: ${previewUrl}`);
    } else {
      console.log('📬 Email delivered via configured SMTP. Check your mailbox provider (e.g., Gmail inbox).');
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error) {
    console.error(`❌ Email send error: ${error.message}`);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hi ${user.firstName},</p>
      <p>We received a request to reset your password.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="background-color: #2196F3; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="color: #666; font-size: 14px;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        If you didn't request a password reset, please ignore this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset - SLIIT Accommodation',
    html
  });
};

/**
 * Send booking confirmation email
 */
const sendBookingConfirmation = async (user, booking, accommodation) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Booking Confirmation</h2>
      <p>Hi ${user.firstName},</p>
      <p>Your booking has been confirmed!</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${accommodation.title}</h3>
        <p><strong>Booking ID:</strong> ${booking._id}</p>
        <p><strong>Check-in:</strong> ${new Date(booking.checkInDate).toLocaleDateString()}</p>
        <p><strong>Check-out:</strong> ${new Date(booking.checkOutDate).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> LKR ${booking.totalAmount.toFixed(2)}</p>
      </div>
      <p>You can view your booking details in your dashboard.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/student/bookings/${booking._id}"
           style="background-color: #4CAF50; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          View Booking
        </a>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Booking Confirmation - SLIIT Accommodation',
    html
  });
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to SLIIT Accommodation!</h2>
      <p>Hi ${user.firstName},</p>
      <p>Welcome to the SLIIT Student Accommodation Management System!</p>
      <p>Your account is ready and you can now:</p>
      <ul>
        <li>Search and book accommodations</li>
        <li>Manage your bookings</li>
        <li>Submit reviews and ratings</li>
        <li>Save your favorite listings</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/dashboard"
           style="background-color: #4CAF50; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Go to Dashboard
        </a>
      </div>
      <p>If you have any questions, feel free to contact our support team.</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to SLIIT Accommodation!',
    html
  });
};

export {
  sendEmail,
  sendPasswordResetEmail,
  sendBookingConfirmation,
  sendWelcomeEmail
};
