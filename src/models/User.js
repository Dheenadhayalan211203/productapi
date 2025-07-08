const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: { // This column will now directly store the hash from signupRequestOtp
    type: DataTypes.STRING,
    allowNull: false,
  }, 
    role:{
      type:DataTypes.STRING,
      allowNull:false
    },
    IsAdmin:{
      type:DataTypes.BOOLEAN,
      allowNull:false
    }
  
  
}, {
  tableName: 'user',
  timestamps: true,
});

// --- REMOVED THE User.beforeCreate HOOK HERE ---
// The password is now hashed in the signupRequestOtp controller

// Method to compare passwords (This remains unchanged and is correct)
User.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;