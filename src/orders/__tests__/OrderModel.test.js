// src/orders/__tests__/OrderModel.test.js
const mongoose = require('mongoose');
const { OrderModel } = require('../OrderModel');  // Import the Order model
const { MongoMemoryServer } = require('mongodb-memory-server'); // In-memory MongoDB for testing

let mongoServer;

// Setup MongoDB in-memory server before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Ensure mongoose connects only once to the test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  }
});

// Close the connection and stop the in-memory server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Order Model Test', () => {

  it('should create an order with valid data', async () => {
    const newOrder = new OrderModel({
      userId: new mongoose.Types.ObjectId(),
      products: [
        {
          productId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 25.5
        }
      ],
      total: 51.0,
      shippingAddress: {
        street: '123 Street',
        suburb: 'Suburbia',
        postcode: '12345',
        state: 'NSW',
        country: 'Australia'
      }
    });

    const savedOrder = await newOrder.save();

    expect(savedOrder).toHaveProperty('_id');
    expect(savedOrder.userId).toBeDefined();
    expect(savedOrder.products.length).toBeGreaterThan(0);
    expect(savedOrder.total).toBe(51.0);
  });

  it('should fail to create an order with missing required fields', async () => {
    const invalidOrder = new OrderModel({
      // Missing required fields
      userId: new mongoose.Types.ObjectId(),
      products: [
        {
          productId: new mongoose.Types.ObjectId(),
          quantity: 0,
          price: ""  // Invalid price
        }
      ],
      total: "",  // Invalid total
      shippingAddress: {
        street: '',
        suburb: '',
        postcode: '',
        state: '',
        country: ''
      }
    });
  
    // Use .validate() to trigger validation errors
    await invalidOrder.validate().catch((validationError) => {
      expect(validationError).toBeDefined();
      expect(validationError.errors.userId).toBeDefined();
      expect(validationError.errors.products).toBeDefined(); // Expect validation for products array
      expect(validationError.errors.total).toBeDefined();
    });
  });
  
  it('should fail to create an order with invalid quantity', async () => {
    const invalidOrder = new OrderModel({
      userId: new mongoose.Types.ObjectId(),
      products: [
        {
          productId: new mongoose.Types.ObjectId(),
          quantity: 0,  // Invalid quantity (should be at least 1)
          price: 25.5
        }
      ],
      total: 25.5,
      shippingAddress: {
        street: '123 Street',
        suburb: 'Suburbia',
        postcode: '12345',
        state: 'NSW',
        country: 'Australia'
      }
    });
  
    // Use .validate() to trigger validation errors for the products array
    await invalidOrder.validate().catch((validationError) => {
      expect(validationError).toBeDefined();
      expect(validationError.errors.products).toBeDefined(); // Ensure products array is validated
      expect(validationError.errors.products[0].quantity).toBeDefined();  // Quantity validation error
    });
  });

  it('should have a default status of "pending"', async () => {
    const newOrder = new OrderModel({
      userId: new mongoose.Types.ObjectId(),
      products: [
        {
          productId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 25.5
        }
      ],
      total: 51.0,
      shippingAddress: {
        street: '123 Street',
        suburb: 'Suburbia',
        postcode: '12345',
        state: 'NSW',
        country: 'Australia'
      }
    });

    const savedOrder = await newOrder.save();

    expect(savedOrder.status).toBe('pending');  // Default value
  });

  it('should only allow valid status values', async () => {
    const invalidStatusOrder = new OrderModel({
      userId: new mongoose.Types.ObjectId(),
      products: [
        {
          productId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 25.5
        }
      ],
      total: 51.0,
      shippingAddress: {
        street: '123 Street',
        suburb: 'Suburbia',
        postcode: '12345',
        state: 'NSW',
        country: 'Australia'
      },
      status: 'invalidStatus'  // Invalid status
    });

    await invalidStatusOrder.validate().catch((validationError) => {
      expect(validationError).toBeDefined();
      expect(validationError.errors.status).toBeDefined();  // Status validation error
    });
  });

  it('should calculate createdAt automatically', async () => {
    const newOrder = new OrderModel({
      userId: new mongoose.Types.ObjectId(),
      products: [
        {
          productId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 25.5
        }
      ],
      total: 51.0,
      shippingAddress: {
        street: '123 Street',
        suburb: 'Suburbia',
        postcode: '12345',
        state: 'NSW',
        country: 'Australia'
      }
    });

    const savedOrder = await newOrder.save();
    expect(savedOrder.createdAt).toBeDefined(); // createdAt should be automatically set
  });
});
