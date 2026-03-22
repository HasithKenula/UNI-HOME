// ============================================================================
// Email Utility - Nodemailer Helper Functions
// ============================================================================

import nodemailer from 'nodemailer';

/**
 * Create reusable transporter
 */
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
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
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`❌ Email send error: ${error.message}`);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Hi ${user.firstName},</p>
      <p>Thank you for registering with SLIIT Accommodation System!</p>
      <p>Please click the button below to verify your email address:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}"
           style="background-color: #4CAF50; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="color: #666; font-size: 14px;">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        If you didn't create an account, please ignore this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - SLIIT Accommodation',
    html
  });
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
      <p>Your account has been successfully verified and you can now:</p>
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
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmation,
  sendWelcomeEmail
};
