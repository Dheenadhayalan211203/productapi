const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  flavors_data: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    defaultValue: null,
    get() {
      const rawValue = this.getDataValue('flavors_data');
      try {
        return rawValue ? JSON.parse(rawValue) : null;
      } catch (e) {
        console.error('Error parsing flavors_data:', e);
        return null;
      }
    },
    set(value) {
      this.setDataValue(
        'flavors_data',
        typeof value === 'string' ? value : JSON.stringify(value)
      );
    }
  },
  nicotine_level: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
    validate: {
      isIn: [['10 mg', '20 mg' , null]]
    }
  },
  description: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    defaultValue: null
  },
  image_base64: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    defaultValue: null
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    },
    get() {
      const value = this.getDataValue('price');
      return parseFloat(value).toFixed(2);
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    },
    get() {
      const value = this.getDataValue('stock');
      return parseInt(value);
    }
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null
  },
  product_group: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    get() {
      const value = this.getDataValue('is_active');
      return Boolean(value);
    }
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (product) => {
      // Ensure price is always a number
      if (product.price && typeof product.price !== 'number') {
        product.price = parseFloat(product.price);
      }
      // Ensure stock is always an integer
      if (product.stock && typeof product.stock !== 'number') {
        product.stock = parseInt(product.stock);
      }
    }
  },
  defaultScope: {
    attributes: {
      exclude: ['createdAt', 'updatedAt'] // Exclude timestamps by default
    }
  },
  scopes: {
    withTimestamps: {
      attributes: { include: ['createdAt', 'updatedAt'] }
    },
    active: {
      where: { is_active: true }
    },
    byCategory: (category) => ({
      where: { category }
    })
  },
  getterMethods: {
    formattedPrice() {
      return `$${this.price}`;
    },
    inStock() {
      return this.stock > 0;
    }
  },
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      // Convert flavors_data to parsed flavors object
      try {
        ret.flavors = ret.flavors_data ? JSON.parse(ret.flavors_data) : null;
      } catch (e) {
        ret.flavors = null;
      }
      delete ret.flavors_data; // Remove the original field
      
      // Convert numeric values
      ret.price = parseFloat(ret.price).toFixed(2);
      ret.stock = parseInt(ret.stock);
      ret.is_active = Boolean(ret.is_active);
      
      // Add virtual fields
      ret.formatted_price = `$${ret.price}`;
      ret.in_stock = ret.stock > 0;
      
      return ret;
    }
  }
});

// Class methods
Product.getActiveProducts = async function() {
  return await this.scope('active').findAll();
};

Product.getByCategory = async function(category) {
  return await this.scope({ method: ['byCategory', category] }).findAll();
};

// Instance methods
Product.prototype.restock = async function(quantity) {
  this.stock += quantity;
  return await this.save();
};

Product.prototype.toggleActive = async function() {
  this.is_active = !this.is_active;
  return await this.save();
};

module.exports = Product;