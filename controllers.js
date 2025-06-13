import { Parser } from "json2csv";
import fs, { writeFileSync } from "fs";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export function ordersSummary(orders) {
  const formattedOrders = orders.map((order) => {
    const products = order.orderDetails.productsResults.map((product) => ({
      productID: product.productId,
      quantity: product.productQuantity,
    }));

    const orderWorth = order.orderDetails.productsResults.reduce(
      (sum, product) => {
        return sum + product.productQuantity * product.productOrderPrice;
      },
      0
    );

    return {
      orderID: order.orderId,
      products: products,
      orderWorth: orderWorth,
    };
  });

  return formattedOrders;
}

export function ordersInCSVFriendlyFormat(formattedOrders) {
  if (!formattedOrders) throw new Error("Bad arg");

  return formattedOrders.flatMap((order) =>
    order.products.map((product) => ({
      orderID: order.orderID,
      productID: product.productID,
      quantity: product.quantity,
      orderWorth: order.orderWorth,
    }))
  );
}

export function createCSV(formattedOrders) {
  if (!formattedOrders) throw new Error("Bad arg");

  const dataForCSV = ordersInCSVFriendlyFormat(formattedOrders);
  const dataParser = new Parser();
  const csv = dataParser.parse(dataForCSV);

  fs.writeFile("./orders.csv", csv, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log("Orders written to file successfully.");
    }
  });

  return csv;
}

export function fetchAndActualizeOrders() {
  axios
    .get("https://zooart6.yourtechnicaldomain.com/api/admin/v5/orders/orders", {
      params: { limit: 5, offset: 10 },
      headers: { "X-API-KEY": process.env.X_API_KEY },
    })
    .then((response) => {
      const orders = response.data.Results;
      const formattedOrders = ordersSummary(orders);

      const ordersStringified = JSON.stringify(formattedOrders, null, 2);
      fs.writeFile("./orders.json", ordersStringified, (err) => {
        if (err) {
          console.error("Error writing to file:", err);
        } else {
          console.log("Orders written to file successfully.");
        }
      });
      console.log("Orders fetched successfully:", response.data.Results.length);
    })
    .catch((error) => {
      console.error("Error fetching orders:", error);
    });
}
