const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productid: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userid: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  flavour: {
    type: DataTypes.STRING,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'cart',
  timestamps: false,
  hooks: {
    beforeUpdate: (cart) => {
      cart.updated_at = new Date();
    }
  },
  indexes: [
    {
      unique: true,
      fields: ['userid', 'productid', 'flavour'],
      name: 'unique_cart_item'
    }
  ]
});

module.exports = Cart;