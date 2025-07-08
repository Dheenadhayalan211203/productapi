        const express = require('express');
      const cors = require('cors');
      const { connectDB, sequelize } = require('./config/db');
      const authRoutes = require('./routes/authRoutes');
      const User = require('./models/User');
      const OTP = require('./models/OTP');
      const Product = require('./models/Product');
      const Category = require('./models/Category');
      const Cart=require("./models/Cart")
      const router = express.Router();
       

    
      
      require('dotenv').config();

      const app = express();
      const PORT = process.env.PORT || 5000;

      // Connect to database
      connectDB();

      // CORS Configuration
      const corsOptions = {
        origin:   'https://exprz.co.uk' ,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization','Accept'],
        credentials: true,
        optionsSuccessStatus: 200
      };

      // Middleware
      app.use(cors(corsOptions));
      app.use(express.json({ limit: '50mb' }));
      app.use(express.urlencoded({ limit: '50mb', extended: true }));
      app.options('*', cors(corsOptions)); // Handle preflight
       


      // Sync database models
      sequelize.sync()
        .then(() => console.log('Database synced successfully.'))
        .catch(err => console.error('Error syncing database:', err));

      // Routes
      app.use('/api/auth', authRoutes);

      // Protected route example
      const { protect } = require('./middleware/authMiddleware');
      app.get('/api/protected', protect, (req, res) => {
        res.json({ message: `Welcome ${req.user.username}!` });
      });

      // Product API Endpoints

      // Create Product Endpoint (Optimized Version)
      app.post('/api/admin/products', async (req, res) => {
        try {
          // Validate required fields
          if (!req.body.name || !req.body.brand || req.body.price === undefined) {
            return res.status(400).json({
              error: 'Name, brand, and price are required fields'
            });
          }

          // Prepare product data
          const productData = {
            name: req.body.name,
            brand: req.body.brand,
            flavors_data: req.body.flavors_data || [],
            nicotine_level: req.body.nicotine_level || null,
            description: req.body.description || null,
            image_base64: req.body.image_base64 || null,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock) || 0,
            category: req.body.category || null,
            product_group: req.body.product_group || null,
            is_active: true
          };

          // Create the product using Sequelize model
          const product = await Product.create(productData);

          // Format the response
          const responseData = product.toJSON();
          try {
            responseData.flavors = responseData.flavors_data ? 
                                JSON.parse(responseData.flavors_data) : 
                                [];
          } catch (e) {
            console.error('Error parsing flavors_data in response:', e);
            responseData.flavors = [];
          }
          delete responseData.flavors_data;

          res.status(201).json({
            message: 'Product created successfully',
            product: responseData
          });

        } catch (error) {
          console.error('Error creating product:', error);
          
          let errorMessage = 'Failed to create product';
          let errorDetails = '';
          
          if (error.name === 'SequelizeValidationError') {
            errorMessage = 'Validation error';
            errorDetails = error.errors.map(err => err.message).join(', ');
          } else if (error.response) {
            errorMessage = error.response.data.error || errorMessage;
            errorDetails = error.response.data.details || 
                        (typeof error.response.data === 'string' ? error.response.data : '');
          }

          res.status(500).json({
            error: `${errorMessage} ${errorDetails ? `- ${errorDetails}` : ''}`.trim()
          });
        }
      });

      // Get All Products
      app.get('/api/products', async (req, res) => {
        try {
          const [products] = await sequelize.query('SELECT * FROM products WHERE is_active = true');
          
          const productsWithFlavors = products.map(product => ({
            ...product,
            flavors: product.flavors_data ? JSON.parse(product.flavors_data) : []
          }));

          res.json(productsWithFlavors);
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Server error' });
        }
      });

      // Get Product by ID
      app.get('/api/products/:id', async (req, res) => {
        try {
          const productId = req.params.id;
          
          if (!/^\d+$/.test(productId)) {
            return res.status(400).json({ error: 'Invalid product ID format' });
          }

          const [product] = await sequelize.query(
            'SELECT * FROM products WHERE id = ?',
            { replacements: [productId] }
          );

          if (!product || product.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
          }

          res.json({
            ...product[0],
            flavors: product[0].flavors_data ? JSON.parse(product[0].flavors_data) : []
          });
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Server error' });
        }
      });

 
 
      

      // Start server
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });