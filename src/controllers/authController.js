const User = require('../models/User');
const OTP = require('../models/OTP'); // Import OTP model
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/jwt');
const { sendOtpEmail } = require('../config/email'); // Import email sender
const bcrypt = require('bcryptjs'); // Needed for password hashing if user is created here

const role="user";
const IsAdmin=0;

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
};

// Helper to generate a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Initiate signup by sending OTP
// @route   POST /api/auth/signup-request-otp
// @access  Public
exports.signupRequestOtp = async (req, res) => {
  const { username, email, password ,phone } = req.body;

  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password immediately for storage if user is later created
    // Or save it temporarily if you create the user in verify-otp
    const hashedPassword = await bcrypt.hash(password, 10); // Hash here so we don't send plain password around

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

    // Store or update OTP in DB
    await OTP.upsert({ // upsert will create if not exists, update if exists based on unique key (email)
      email,
      otp,
      expiresAt,
      // Store temp user data (username, hashedPassword) to retrieve later
      tempUserData: JSON.stringify({ username, password: hashedPassword , role , IsAdmin ,phone })
    });

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email. Please verify to complete signup.' });

  } catch (error) {
    console.error('Error in signupRequestOtp:', error);
    res.status(500).json({ message: error.message || 'Server error during OTP request' });
  }
};

// @desc    Verify OTP and complete user signup
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ where: { email, otp } });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP or email.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      // Clean up expired OTP
      await otpRecord.destroy();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // OTP is valid and not expired, proceed to create user
    const tempUserData = JSON.parse(otpRecord.tempUserData);
    const { username, password , role , IsAdmin,phone} = tempUserData; // Password is already hashed

    const user = await User.create({ username, email, password , role , IsAdmin ,phone });

    // Delete the used OTP record
    await otpRecord.destroy();

    if (user) {
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user.id),
        phone:user.phone
      });
    } else {
      res.status(400).json({ message: 'User creation failed after OTP verification.' });
    }

  } catch (error) {
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ message: error.message || 'Server error during OTP verification' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // New expiration for 5 minutes

    // Retrieve temporary user data to store with new OTP
    let existingOtpRecord = await OTP.findOne({ where: { email } });
    let tempUserData = {};
    if (existingOtpRecord && existingOtpRecord.tempUserData) {
        tempUserData = JSON.parse(existingOtpRecord.tempUserData);
    } else {
        // This scenario means resend was called without initial signup request.
        // Or if the record was deleted due to expiration before resend.
        // For simplicity, we'll assume the initial data is still available or we need to reject this.
        // A more robust solution might require storing temp data longer or forcing re-initial signup.
        return res.status(400).json({ message: 'No pending signup request found for this email. Please start signup again.' });
    }


    await OTP.upsert({
      email,
      otp,
      expiresAt,
      tempUserData: JSON.stringify(tempUserData) // Keep existing temp user data
    });

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'New OTP sent to your email.' });

  } catch (error) {
    console.error('Error in resendOtp:', error);
    res.status(500).json({ message: error.message || 'Server error during OTP resend' });
  }
};

// Existing login logic (no change needed)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials: User not found' });
    }

    const isMatch = await user.comparePassword(password);

    if (user && isMatch) {
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        IsAdmin:user.IsAdmin,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials: Password incorrect' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};