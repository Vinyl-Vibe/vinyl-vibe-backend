# API Endpoints Naming

## General Guidelines

1. **Use Plural Nouns for Collections**
* Use plural forms for endpoints that represent collections of resources
* Example:
  * `/products` for a collection of products
  * `/users` for a collection of users

2. **Use Singular Nouns for Specific Resources**
* Use singular forms when referring to a specific resource by its ID
* Example:
  * `/products/:product-id` for a specific product

3. **Keep Slugs Lowercase**
* Use lowercase letters to avoid case-sensitivity issues
* Example:
  * `/orders` instead of `/Orders`

4. **Use Hyphens for Multi-Word Slugs**
* Use hyphens to separate words in multi-word slugs
* Example:
  * `/order-history` instead of `/orderHistory`

5. **Avoid Verbs in Endpoints**
* Use HTTP methods to define the action (e.g., `GET`, `POST`, `DELETE`), not the endpoint name
* Example:
  * Use `POST /users` to create a user, not `/create-user`

6. **Use Nested Resources for Hierarchical Data**
* Use nested paths to show relationships between resources
* Example:
  * `/users/:user-id/orders` for orders belonging to a specific user


## API Endpoints Naming:

Below are the endpoints for the API.

### Users:

-   `GET /users` – Get all users
-   `GET /users/:user-id` – Get a specific user by ID
-   `POST /users` – Create a new user
-   `PUT /users/:user-id` – Update a specific user
-   `DELETE /users/:user-id` – Delete a user

-   `POST /auth/login` – Log in a user
-   `POST /auth/register` – Register a new user
-   `POST /auth/logout` – Log out the current user
-   `GET /auth/refresh` – Refresh a user's authentication token

### Products:

-   `GET /products` – Get all products
-   `GET /products/:product-id` – Get a specific product
-   `POST /products` – Add a new product
-   `PUT /products/:product-id` – Update a specific product
-   `DELETE /products/:product-id` – Delete a product

    #### Filtering and Searching Query Parameters:

-   `/products` - Get all products
-   `/products?type=vinyl` - Get products filtered by type
-   `/products?search=ABBA` - Search for products by name
-   `/products?price-min=100&price-max=500` - Filter products by price range
-   `/products?in-stock=true` - Filter by availability (in stock only)
-   `/products?type=vinyl&search=beatles&price-min=50&price-max=300` - Combine filters (type, search, price range)
-   `/products?sort=price&order=asc` - Sort products

### Orders:

-   `GET /orders` – Get all orders
-   `GET /orders/:order-id` – Get a specific order
-   `POST /orders` – Create a new order
-   `PUT /orders/:order-id` – Update an existing order
-   `DELETE /orders/:order-id` – Cancel an order

    #### Filtering and Searching Query Parameters:

-   `/orders` - Get all orders
-   `/orders?status=pending` - Filter orders by status
-   `/orders?user-id=123` - Filter orders by user ID
-   `/orders?start-date=2024-01-01&end-date=2024-12-31` - Filter orders by date range
-   `/orders?status=completed&start-date=2024-01-01&end-date=2024-01-31` - Combine filters (status, date range)

### Cart:

-   `GET /cart` – Get the current cart
-   `POST /cart` – Add an item to the cart
-   `PUT /cart/:item-id` – Update the quantity of an item in the cart
-   `DELETE /cart/:item-id` – Remove an item from the cart

    #### Filtering and Searching Query Parameters:

-   `/cart?user-id=123` - Get cart items filtered by user

<br>