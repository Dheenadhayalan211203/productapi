const express = require('express');
const { signupRequestOtp, verifyOtp, resendOtp, login } = require('../controllers/authController');

const router = express.Router();

// New route for initiating signup and sending OTP
router.post('/signup-request-otp', signupRequestOtp);
// New route for verifying OTP and completing signup
router.post('/verify-otp', verifyOtp);
// New route for resending OTP
router.post('/resend-otp', resendOtp);

// Existing login route
router.post('/login', login);

module.exports = router;