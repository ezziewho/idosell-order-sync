import express from "express";
import basicAuth from "./middleware/basicAuth.js";
import dotenv from "dotenv";
import fs from "fs";
import { CronJob } from "cron";
import { createCSV, fetchAndActualizeOrders } from "./controllers.js";

dotenv.config();
const app = express();
const port = 5555;

app.use(express.json());

// Test authentication endpoint
app.get("/testAuth", basicAuth, (req, res) => {
  res.json({ message: "Authentication successful" });
});

// Helper to read and parse orders.json safely
function readOrdersFile(callback) {
  fs.readFile("./orders.json", "utf8", (err, data) => {
    if (err) {
      return callback({ status: 500, message: "Error reading file" });
    }
    try {
      const orders = JSON.parse(data);
      if (!Array.isArray(orders)) {
        return callback({ status: 400, message: "Invalid data format" });
      }
      callback(null, orders);
    } catch (e) {
      callback({ status: 500, message: "Error parsing data" });
    }
  });
}

// Download all orders, optionally filtered by minWorth/maxWorth
app.get("/download", basicAuth, (req, res) => {
  readOrdersFile((error, orders) => {
    if (error) {
      console.error(error.message);
      return res.status(error.status).send(error.message);
    }

    let filteredOrders = orders;
    const { minWorth, maxWorth } = req.query;

    // Validate query params
    let min = 0,
      max = Infinity;
    if (minWorth !== undefined && isNaN(parseFloat(minWorth))) {
      return res.status(400).send("minWorth must be a number");
    }
    if (maxWorth !== undefined && isNaN(parseFloat(maxWorth))) {
      return res.status(400).send("maxWorth must be a number");
    }
    if (minWorth !== undefined) min = parseFloat(minWorth);
    if (maxWorth !== undefined) max = parseFloat(maxWorth);

    if (min > max) {
      return res.status(400).send("minWorth cannot be greater than maxWorth");
    }

    filteredOrders = filteredOrders.filter((order) => {
      const worth = parseFloat(order.orderWorth);
      // Ignore orders without a valid orderWorth
      if (isNaN(worth)) return false;
      return worth >= min && worth <= max;
    });

    if (filteredOrders.length === 0) {
      return res.status(404).send("No orders found for given filters");
    }

    try {
      const csv = createCSV(filteredOrders);
      res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error generating CSV");
    }
  });
});

// Download a single order by ID
app.get("/download/:id", basicAuth, (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).send("Order ID is required");
  }

  readOrdersFile((error, orders) => {
    if (error) {
      console.error(error.message);
      return res.status(error.status).send(error.message);
    }

    const order = orders.find((order) => order.orderID === id);
    if (!order) {
      return res.status(404).send("Order not found");
    }

    try {
      const csv = createCSV([order]);
      res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error generating CSV");
    }
  });
});

// Schedule actualization job every day at midnight
const job = new CronJob("0 0 0 * * *", fetchAndActualizeOrders());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
