const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Only one active OTP per email at a time
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  tempUserData: { // <--- NEW COLUMN
    type: DataTypes.TEXT, // Store as JSON string
    allowNull: false,
  },
}, {
  tableName: 'OTP', // Or 'otps' if you prefer plural
  timestamps: true, // createdAt and updatedAt will be added automatically
});

module.exports = OTP;