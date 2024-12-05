# Vinyl Vibe (back end)

This repo is the back end API for an e-commerce website. This back end is hosted on Render and will connect to a front end which is hosted on Netlify. The backend uses a MongoDB database hosted on MongoDB Atlas.

- Front end url: `vinylvibe.live`
- Back end url: `api.vinylvibe.live`

<br />

## API Endpoints that will need to be created/supported:

### CRUD Endpoints:

Below are the CRUD endpoints for the API.

User Management:

-   `GET /users` – Get all users
-   `GET /users/:userId` – Get a specific user by ID
-   `POST /users` – Create a new user
-   `PUT /users/:userId` – Update a specific user
-   `DELETE /users/:userId` – Delete a user

Authentication:

-   `POST /auth/login` – Log in a user
-   `POST /auth/register` – Register a new user
-   `POST /auth/logout` – Log out the current user
-   `GET /auth/refresh` – Refresh a user's authentication token

E-commerce:

-   `GET /products` – Get all products
-   `GET /products/:productId` – Get a specific product
-   `POST /products` – Add a new product
-   `PUT /products/:productId` – Update a specific product
-   `DELETE /products/:productId` – Delete a product

Orders:

-   `GET /orders` – Get all orders
-   `GET /orders/:orderId` – Get a specific order
-   `POST /orders` – Create a new order
-   `PUT /orders/:orderId` – Update an existing order
-   `DELETE /orders/:orderId` – Cancel an order

Shopping Cart:

-   `GET /cart` – Get the current cart
-   `POST /cart` – Add an item to the cart
-   `PUT /cart/:itemId` – Update the quantity of an item in the cart
-   `DELETE /cart/:itemId` – Remove an item from the cart

Payments:

-   `POST /payments` – Process a payment
-   `GET /payments/:paymentId` – Get details of a specific payment

Categories:

-   `GET /categories` – Get all categories
-   `GET /categories/:categoryId` – Get a specific category

<br />

### Filtering and Searching Query Parameters:

Use query parameters for filtering and searching

Products:

-   `/products` - Get all products
-   `/products?category=electronics` - Get products filtered by category
-   `/products?search=ABBA` - Search for products by name
-   `/products?price_min=100&price_max=500` - Filter products by price range
-   `/products?in_stock=true` - Filter by availability (in stock only)
-   `/products?category=vinyl&search=beatles&price_min=50&price_max=300` - Combine filters (category, search, price range)
-   `/products?sort=price&order=asc` - Sort products

Orders:

-   `/orders` - Get all orders
-   `/orders?status=pending` - Filter orders by status
-   `/orders?user_id=123` - Filter orders by user ID
-   `/orders?start_date=2024-01-01&end_date=2024-12-31` - Filter orders by date range
-   `/orders?status=completed&start_date=2024-01-01&end_date=2024-01-31` - Combine filters (status, date range)

Categories:

-   `/categories` - Get all categories
-   `/categories?search=rock` - Search categories by name

Shopping Cart:

-   `/cart?user_id=123` - Get cart items filtered by user

Payments:

-   `/payments` - Get all payments
-   `/payments?user_id=123` - Filter payments by user ID
-   `/payments?start_date=2024-01-01&end_date=2024-12-31` - Filter payments by date range
-   `/payments?status=successful` - Filter payments by status
