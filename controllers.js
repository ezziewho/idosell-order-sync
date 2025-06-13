import { Parser } from "json2csv";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// Safely summarize orders, handling missing fields
export function ordersSummary(orders) {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => {
    const productsArr = order?.orderDetails?.productsResults || [];
    const products = Array.isArray(productsArr)
      ? productsArr.map((product) => ({
          productID: product?.productId ?? null,
          quantity: product?.productQuantity ?? 0,
        }))
      : [];

    const orderWorth = Array.isArray(productsArr)
      ? productsArr.reduce(
          (sum, product) =>
            sum +
            (Number(product?.productQuantity) || 0) *
              (Number(product?.productOrderPrice) || 0),
          0
        )
      : 0;

    return {
      orderID: order?.orderId ?? null,
      products,
      orderWorth,
    };
  });
}

// Flatten orders for CSV, handle missing products
export function ordersInCSVFriendlyFormat(formattedOrders) {
  if (!Array.isArray(formattedOrders)) throw new Error("Bad arg");

  return formattedOrders.flatMap((order) =>
    Array.isArray(order.products) && order.products.length > 0
      ? order.products.map((product) => ({
          orderID: order.orderID,
          productID: product.productID,
          quantity: product.quantity,
          orderWorth: order.orderWorth,
        }))
      : [
          {
            orderID: order.orderID,
            productID: "",
            quantity: "",
            orderWorth: order.orderWorth,
          },
        ]
  );
}

// Create CSV and write to file, handle errors
export function createCSV(formattedOrders) {
  if (!Array.isArray(formattedOrders)) throw new Error("Bad arg");

  const dataForCSV = ordersInCSVFriendlyFormat(formattedOrders);
  const dataParser = new Parser();
  let csv;
  try {
    csv = dataParser.parse(dataForCSV);
  } catch (err) {
    console.error("Error parsing CSV:", err);
    throw err;
  }

  fs.writeFile("./orders.csv", csv, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log("Orders written to file successfully.");
    }
  });

  return csv;
}

// Fetch and actualize orders, handle API and file errors
export function fetchAndActualizeOrders() {
  axios
    .get("https://zooart6.yourtechnicaldomain.com/api/admin/v5/orders/orders", {
      params: { limit: 5, offset: 10 },
      headers: { "X-API-KEY": process.env.X_API_KEY },
    })
    .then((response) => {
      const orders = response.data?.Results || [];
      const formattedOrders = ordersSummary(orders);

      const ordersStringified = JSON.stringify(formattedOrders, null, 2);
      fs.writeFile("./orders.json", ordersStringified, (err) => {
        if (err) {
          console.error("Error writing to file:", err);
        } else {
          console.log("Orders written to file successfully.");
        }
      });
      console.log("Orders fetched successfully:", orders.length);
    })
    .catch((error) => {
      console.error("Error fetching orders:", error?.message || error);
    });
}
