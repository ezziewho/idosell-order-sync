import express from "express";
import basicAuth from "./middleware/basicAuth.js";
import dotenv from "dotenv";
import axios from "axios";
import fs, { writeFile } from "fs";
import { CronJob } from "cron";
import {
  ordersSummary,
  ordersInCSVFriendlyFormat,
  createCSV,
  fetchAndActualizeOrders,
} from "./controllers.js";

dotenv.config(); // Load environment variables from .env file
const app = express();
const port = 5555;

app.use(express.json());

// Middleware for basic authentication
app.get("/testAuth", basicAuth, (req, res) => {
  res.json({ message: "Authentication successful" });
});

// Endpoint to fetch and save orders
app.get("/download", basicAuth, (req, res) => {
  fs.readFile("./orders.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("error reading file");
    }
    try {
      let orders = JSON.parse(data);
      if (!Array.isArray(orders)) {
        return res.status(400).send("Invalid data format");
      }

      // Filter orders based on minWorth and maxWorth if provided
      const { minWorth, maxWorth } = req.query;

      if (minWorth || maxWorth) {
        const min = minWorth ? parseFloat(minWorth) : 0;
        const max = maxWorth ? parseFloat(maxWorth) : Infinity;

        orders = orders.filter((order) => {
          const orderWorth = parseFloat(order.orderWorth);
          return orderWorth >= min && orderWorth <= max;
        });
      }

      //console.log(Array.isArray(dataJSON));
      const csv = createCSV(orders);
      res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).send("error processing data");
    }
  });
});

app.get("/download/:id", basicAuth, (req, res) => {
  const id = req.params.id;
  fs.readFile("./orders.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("error reading file");
    }
    try {
      let orders = JSON.parse(data);
      if (!Array.isArray(orders)) {
        return res.status(400).send("Invalid data format");
      }

      // Filter orders based on the provided ID
      const order = orders.find((order) => order.orderID === id);
      if (!order) {
        return res.status(404).send("Order not found");
      }

      const csv = createCSV([order]);
      res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).send("error processing data");
    }
  });
});

// actualize job every day at midnight
const job = new CronJob("0 0 0 * * *", fetchAndActualizeOrders());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
