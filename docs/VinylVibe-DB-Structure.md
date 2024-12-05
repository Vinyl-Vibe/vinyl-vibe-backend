# Vinyl Vibe DB

This document outlines the structure of the MongoDB database for Vinyl Vibe, including the cluster, databases, and collections.

<br>

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

| Field            | Type     | Description                          |
| ---------------- | -------- | ------------------------------------ |
| **\_id**         | ObjectId | Unique identifier for the user       |
| **name**         | String   | Full name of the user                |
| **email**        | String   | User's email address                 |
| **passwordHash** | String   | Hashed password for authentication   |
| **role**         | String   | Role of the user (customer or admin) |
| **address**      | Object   | User's primary address               |
| - street         | String   | Street address                       |
| - city           | String   | City name                            |
| - postcode       | String   | Postal/ZIP code                      |
| - state          | String   | State/Province                       |
| - country        | String   | Country name                         |
| **refreshToken** | String   | Refresh token for JWT authentication |
| **createdAt**    | Date     | Account creation timestamp           |
| **lastLogin**    | Date     | Last login timestamp                 |
| **isActive**     | Boolean  | Whether the account is active        |

### Example `users` Entry:

```json
{
	"_id": "64abc1234def5678ghi90jkl",
	"name": "John Doe",
	"email": "john.doe@example.com",
	"passwordHash": "$2b$10$hashedpassword123",
	"role": "customer",
	"address": {
		"street": "123 Main St",
		"city": "Springfield",
		"postcode": "12345",
		"state": "Illinois",
		"country": "USA"
	},
	"refreshToken": "someRandomJWTTokenHere",
	"createdAt": "2024-01-01T12:00:00Z",
	"lastLogin": "2024-01-01T12:00:00Z",
	"isActive": true
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

<br>

<style>
table {
    width: 100%;
}
</style>
