// Import the ProductModel to interact with the MongoDB database
const { ProductModel } = require("./ProductModel");

// Mongoose Methods; save(), find(), findById(), findByIdAndUpdate()
// and findByIdAndDelete() are used to interact with the database.

//Service function to create a new product.

const createProduct = async (productData) => {
	try {
		// Create a new product instance using the data provided
		const newProduct = new ProductModel(productData);
		// Save the new product to the database and return the saved document
		return await newProduct.save();
	} catch (error) {
		// Throw an error if something goes wrong
		throw new Error(`Error creating product: ${error.message}`);
	}
};

//Service function to retrieve all products from the database.

const getAllProducts = async (queryParams) => {
	try {
	  // Start with an empty query object
	  let query = {}
	  
	  // Filter by type
	  // URL Examples:
	  // /products?type=vinyl
	  // /products?type=turntable
	  // /products?type=accessory
	  // /products?type=speaker
	  if (queryParams.type) {
		query.type = queryParams.type
	  }
	  
	  // Search by name (case-insensitive)
	  // URL Examples:
	  // /products?search=Dark Side of the Moon
	  // /products?search=Beatles
	  // /products?search=Pro-Ject
	  if (queryParams.search) {
		query.name = { $regex: queryParams.search, $options: 'i' }
	  }
	  
	  // Filter by price range
	  // URL Examples:
	  // /products?price-min=20&price-max=50    (products between $20 and $50)
	  // /products?price-min=100                (products $100 and above)
	  // /products?price-max=30                 (products $30 and below)
	  if (queryParams['price-min'] || queryParams['price-max']) {
		query.price = {}
		if (queryParams['price-min']) {
		  query.price.$gte = Number(queryParams['price-min'])
		}
		if (queryParams['price-max']) {
		  query.price.$lte = Number(queryParams['price-max'])
		}
	  }
	  
	  // Filter by stock availability
	  // URL Example:
	  // /products?in-stock=true                (only show products with stock > 0)
	  if (queryParams['in-stock'] === 'true') {
		query.stock = { $gt: 0 }
	  }
	  
	  // Create the base query
	  let productsQuery = ProductModel.find(query)
	  
	  // Handle sorting
	  // URL Examples:
	  // /products?sort=price&order=asc         (sort by price, lowest first)
	  // /products?sort=price&order=desc        (sort by price, highest first)
	  // /products?sort=name&order=asc          (sort alphabetically A-Z)
	  // /products?sort=name&order=desc         (sort alphabetically Z-A)
	  if (queryParams.sort) {
		const sortOrder = queryParams.order === 'desc' ? -1 : 1
		productsQuery = productsQuery.sort({ [queryParams.sort]: sortOrder })
	  }
	  
	  // Complex URL Examples combining multiple parameters:
	  // /products?type=vinyl&search=Pink Floyd&price-min=20&price-max=50&in-stock=true
	  // (Find in-stock vinyl records by Pink Floyd between $20-$50)
	  
	  // /products?type=turntable&price-min=200&sort=price&order=asc
	  // (Find turntables $200 and above, sorted by price low to high)
	  
	  // /products?search=Beatles&in-stock=true&sort=name&order=asc
	  // (Find in-stock Beatles items, sorted alphabetically)
	  
	  // Execute the query and return results
	  return await productsQuery
	  
	} catch (error) {
	  throw new Error(`Error retrieving products: ${error.message}`)
	}
  }


// Service function to retrieve a single product by its ID.

const getProductById = async (productId) => {
	try {
		// Use Mongoose's `findById` method to get the product by its ID
		const product = await ProductModel.findById(productId);
		// If no product is found, throw a custom error
		if (!product) {
			throw new Error("Product not found");
		}
		// Return the found product
		return product;
	} catch (error) {
		// Throw an error if something goes wrong
		throw new Error(`Error retrieving product: ${error.message}`);
	}
};

// Service function to update a product by its ID.

const updateProduct = async (productId, productData) => {
	try {
		// Use Mongoose's `findByIdAndUpdate` method to update the product
		const updatedProduct = await ProductModel.findByIdAndUpdate(
			productId, // The ID of the product to update
			productData, // The new data for the product
			{ new: true, runValidators: true } // Return the updated document and validate new data
		);
		// If no product is found, throw a custom error
		if (!updatedProduct) {
			throw new Error("Product not found");
		}
		// Return the updated product
		return updatedProduct;
	} catch (error) {
		// Throw an error if something goes wrong
		throw new Error(`Error updating product: ${error.message}`);
	}
};

// Service function to delete a product by its ID.

const deleteProduct = async (productId) => {
	try {
		// Use Mongoose's `findByIdAndDelete` method to delete the product
		const deletedProduct = await ProductModel.findByIdAndDelete(productId);
		// If no product is found, throw a custom error
		if (!deletedProduct) {
			throw new Error("Product not found");
		}
		// Return the deleted product
		return deletedProduct;
	} catch (error) {
		// Throw an error if something goes wrong
		throw new Error(`Error deleting product: ${error.message}`);
	}
};

// Export all service functions so they can be used in other parts of the application
module.exports = {
	createProduct,
	getAllProducts,
	getProductById,
	updateProduct,
	deleteProduct,
};
