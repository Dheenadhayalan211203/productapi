const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like 'Outlook', 'SendGrid', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Optional: For self-signed certificates or specific environments
  tls: {
    rejectUnauthorized: false
  }
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your E-commerce App OTP Verification',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Email Verification</h2>
        <p>Hello,</p>
        <p>Thank you for signing up for our E-commerce App! To complete your registration, please use the following One-Time Password (OTP):</p>
        <p style="font-size: 24px; font-weight: bold; color: #007bff; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
        <p>This OTP is valid for 5 minutes. Do not share this OTP with anyone.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>The E-commerce App Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully.');
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email.');
  }
};

module.exports = { sendOtpEmail };