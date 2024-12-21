// src/orders/tests/OrderModel.test.js
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
      // Missing userId, products, and total
    });

    let error;
    try {
      await invalidOrder.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.userId).toBeDefined();  // Missing userId
    expect(error.errors.products).toBeDefined();  // Missing products
    expect(error.errors.total).toBeDefined();  // Missing total
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
      total: 51.0,
      shippingAddress: {
        street: '123 Street',
        suburb: 'Suburbia',
        postcode: '12345',
        state: 'NSW',
        country: 'Australia'
      }
    });

    let error;
    try {
      await invalidOrder.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.products[0].quantity).toBeDefined();  // Quantity validation error
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

    let error;
    try {
      await invalidStatusOrder.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.status).toBeDefined();  // Status validation error
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
