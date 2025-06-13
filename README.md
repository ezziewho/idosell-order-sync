# IdoSell Order Sync API

A lightweight backend application for synchronizing, processing, and exporting sales data from the IdoSell platform. Designed as a daily job with secure REST API access.

---

## Features

* Automatic daily fetching of orders from IdoSell API
* Order data transformation to extract:

  * `orderID`: order number
  * `products`: array of sold items with quantity
  * `orderWorth`: total value of the order
* Export to CSV format (entire dataset or single order)
* Filtering by order worth using query parameters: `minWorth`, `maxWorth`
* Basic Auth protection for all endpoints

---

## Example JSON Structure

```json
{
  "orderID": "123456",
  "products": [
    { "productID": "ABC123", "quantity": 2 },
    { "productID": "XYZ789", "quantity": 1 }
  ],
  "orderWorth": 149.99
}
```

---

## API Endpoints

> All endpoints are protected with HTTP Basic Authentication.

### GET `/download`

**Returns:** all orders in CSV format

**Optional query parameters:**

* `minWorth` – minimum order value
* `maxWorth` – maximum order value

**Example:**

```
GET /download?minWorth=50&maxWorth=200
```

### GET `/download/:orderID`

**Returns:** single order in CSV format by order ID

**Example:**

```
GET /download/123456
```

---

## Daily Sync Job

The application runs a scheduled task (cron) every day at midnight to:

* Fetch the latest orders from IdoSell
* Process them into the simplified structure
* Save the data in `orders.json`

---

## Basic Auth Configuration

Set your credentials in `.env` file:

```
AUTH_USER=admin
AUTH_PASS=secret123
```

---

## Project Structure

```
.
├── server.js             # Entry point
├── controllers.js        # Data processing & CSV creation
├── middleware/
│   └── basicAuth.js      # Basic Auth middleware
├── orders.json           # Locally stored processed orders
├── orders.csv            # Generated CSV file
└── .env                  # API keys and credentials
```

---

## Technologies Used

* Node.js
* Express
* Axios (for external API calls)
* json2csv (for CSV conversion)
* cron (for daily tasks)

---

## Contact

Created as part of a backend technical challenge.

Feel free to fork or contact if you have feedback!
