# Vinyl Vibe (back end)

This repo is the back end API for an e-commerce website. This back end is hosted on Render and will connect to a front end which is hosted on Netlify. The backend uses a MongoDB database hosted on MongoDB Atlas.

-   Front end url: `vinylvibe.live`
-   Back end url: `api.vinylvibe.live`

<br />

## API Endpoints that will need to be created/supported:

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

---

## MongoDB Structure

<br>

-   **Cluster**: `Vinyl-Vibe-Cluster`
    -   **Database**: `vinyl-vibe-main`
        -   **Collection**: `users`
        -   **Collection**: `products`
        -   **Collection**: `orders`
        -   **Collection**: `cart`

<br>

## `users` Collection Schema

<br>

| Field                | Type     | Description                        | Validation/Options                                                        |
| -------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------------- |
| \_id                 | ObjectId | Unique identifier for the user     | Auto-generated                                                            |
| email                | String   | User's email address               | Required, Unique, Trimmed, Regex validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ |
| password             | String   | Hashed password for authentication | Required, Min length: 8, Trimmed                                          |
| role                 | String   | User's role in the system          | Enum: ["user", "admin"], Default: "user"                                  |
| profile              | Object   | User's profile information         | -                                                                         |
| - firstName          | String   | User's first name                  | Trimmed                                                                   |
| - lastName           | String   | User's last name                   | Trimmed                                                                   |
| - phoneNumber        | String   | User's contact number              | Trimmed                                                                   |
| - address            | Object   | User's primary address             | -                                                                         |
| -- street            | String   | Street address                     | -                                                                         |
| -- city              | String   | City name                          | -                                                                         |
| -- state             | String   | State/Province                     | -                                                                         |
| -- postalCode        | String   | Postal/ZIP code                    | -                                                                         |
| -- country           | String   | Country name                       | -                                                                         |
| resetPasswordToken   | String   | Token for password reset           | Optional                                                                  |
| resetPasswordExpires | Date     | Expiration time for reset token    | Optional                                                                  |
| createdAt            | Date     | Timestamp of account creation      | Auto-generated                                                            |
| updatedAt            | Date     | Timestamp of last update           | Auto-generated                                                            |

### Example `users` Entry:

```json
{
	"_id": "64abc1234def5678ghi90jkl",
	"email": "john.doe@example.com",
	"password": "$2b$10$hashedpassword123",
	"role": "user",
	"profile": {
		"firstName": "John",
		"lastName": "Doe",
		"phoneNumber": "555-123-4567",
		"address": {
			"street": "123 Main St",
			"city": "Springfield",
			"state": "Illinois",
			"postalCode": "12345",
			"country": "USA"
		}
	},
	"resetPasswordToken": null,
	"resetPasswordExpires": null,
	"createdAt": "2024-01-01T12:00:00Z",
	"updatedAt": "2024-01-01T12:00:00Z"
}
```

<br>

## `products` Collection Schema

<br>

| Field           | Type     | Description                               |
| --------------- | -------- | ----------------------------------------- |
| **\_id**        | ObjectId | Unique identifier for the product         |
| **name**        | String   | Name of the product                       |
| **description** | String   | General description of the product        |
| **price**       | Number   | Price of the product                      |
| **type**        | String   | Product type (vinyl, turntable, etc.)     |
| **brand**       | String   | Product brand. Not used for vinyl.        |
| **albumInfo**   | Object   | (Optional) Only used when type is 'vinyl' |
| - artist        | String   | Name of the artist/band                   |
| - genre         | String   | Genre of the album (e.g., Rock, Jazz)     |
| - trackList     | Array    | List of track names                       |
| - releaseDate   | Date     | Release date of the album                 |
| **stock**       | Number   | Quantity of the product in stock          |
| **images**      | Array    | URLs for product images                   |
| **thumbnail**   | String   | URL for the product's thumbnail image     |
| **createdAt**   | Date     | Timestamp when the product was created    |

### Example `products` Entry:

Vinyl product:

```json
{
	"_id": "64abc1234def5678ghi90xyz",
	"name": "Abbey Road",
	"description": "The iconic Beatles album remastered.",
	"price": 19.99,
	"type": "vinyl",
	"albumInfo": {
		"artist": "The Beatles",
		"genre": "Rock",
		"trackList": [
			"Come Together",
			"Something",
			"Maxwell's Silver Hammer",
			"Octopus's Garden"
		],
		"releaseDate": "1969-09-26T00:00:00Z"
	},
	"stock": 50,
	"images": ["https://example.com/images/abbeyroad_large.jpg"],
	"thumbnail": "https://example.com/images/abbeyroad_thumb.jpg",
	"createdAt": "2024-01-01T12:00:00Z"
}
```

<br>

Non-vinyl product:

```json
{
	"_id": "64abc1234def5678ghi90abc",
	"name": "Vinyl Record Cleaner",
	"description": "A high-quality vinyl record cleaning kit.",
	"price": 29.99,
	"type": "accessories",
	"stock": 100,
	"images": ["https://example.com/images/cleaner_large.jpg"],
	"thumbnail": "https://example.com/images/cleaner_thumb.jpg",
	"createdAt": "2024-01-01T12:00:00Z"
}
```

<br>

## `orders` Collection Schema

<br>

| Field               | Type     | Description                                       |
| ------------------- | -------- | ------------------------------------------------- |
| **\_id**            | ObjectId | Unique identifier for the order                   |
| **userId**          | ObjectId | Reference to the user who placed the order        |
| **products**        | Array    | Array of objects containing product details       |
| - productId         | ObjectId | Reference to the product in the order             |
| - unitPrice         | Number   | Price per unit of the product at time of order    |
| - quantity          | Number   | Quantity of the product ordered                   |
| **total**           | Number   | Total cost of the order                           |
| **status**          | String   | Status of the order (pending, shipped, delivered) |
| **shippingAddress** | Object   | Address for order delivery                        |
| - street            | String   | Street address                                    |
| - city              | String   | City name                                         |
| - postcode          | String   | Postal/ZIP code                                   |
| - state             | String   | State/Province                                    |
| - country           | String   | Country name                                      |
| **createdAt**       | Date     | Order creation timestamp                          |

### Example `orders` Entry:

```json
{
	"_id": "64order1234def5678ghi90abc",
	"userId": "64user1234def5678ghi90jkl",
	"products": [
		{
			"productId": "64prod1234def5678ghi90xyz",
			"unitPrice": 19.99,
			"quantity": 2
		},
		{
			"productId": "64prod5678def1234ghi90abc",
			"unitPrice": 129.99,
			"quantity": 1
		}
	],
	"total": 169.97,
	"status": "pending",
	"shippingAddress": {
		"street": "123 Main St",
		"city": "Springfield",
		"postcode": "12345",
		"state": "Illinois",
		"country": "USA"
	},
	"createdAt": "2024-01-02T10:00:00Z"
}
```

<br>

## `cart` Collection Schema

<br>

| Field         | Type     | Description                              |
| ------------- | -------- | ---------------------------------------- |
| **\_id**      | ObjectId | Unique identifier for the cart           |
| **userId**    | ObjectId | Reference to the user who owns the cart  |
| **products**  | Array    | Array of objects representing cart items |
| - productId   | ObjectId | Reference to the product in the cart     |
| - quantity    | Number   | Quantity of the product in the cart      |
| **createdAt** | Date     | Timestamp when the cart was created      |
| **updatedAt** | Date     | Timestamp when the cart was last updated |

### Example `cart` Entry:

```json
{
	"_id": "64cart1234def5678ghi90abc",
	"userId": "64user1234def5678ghi90jkl",
	"products": [
		{
			"productId": "64prod1234def5678ghi90xyz",
			"quantity": 2
		},
		{
			"productId": "64prod5678def1234ghi90abc",
			"quantity": 1
		}
	],
	"createdAt": "2024-01-01T12:00:00Z",
	"updatedAt": "2024-01-02T15:30:00Z"
}
```
