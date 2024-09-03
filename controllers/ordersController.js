const orders = require("../models/ordersModel");
const users = require("../models/usersModel");
const addresses = require("../models/addressModel");
const mongoose = require("mongoose");
const PaymentApis = require("../PaymentGetaway/PaymentGetaway");
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

const postOrder = async (req, res) => {
  try {
    const {
      ShippingAddress,
      BillingInfo,
      PaymentMethod,
      ProductInfo,
      TotalAmount,
      PaymentId,
    } = req.body;
    if (
      !ShippingAddress ||
      !BillingInfo ||
      !PaymentMethod ||
      !ProductInfo ||
      !TotalAmount
    ) {
      return res
        .status(204)
        .json({ response_code: 204, message: "All fields are required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid user" });
    }

    const order = new orders({
      user_Id: dbUser._id,
      shipping_address: ShippingAddress,
      billing_info: BillingInfo,
      payment_method: PaymentMethod,
      product_info: ProductInfo,
      total_amount: TotalAmount,
      payment_id: PaymentId,
      payment_status: "pending",
      delivery_status: "order confirmed",
    });

    const afterorder = await order.save();
    console.log("order", order);
    console.log("order", order._id);
    console.log("afterorder", afterorder);

    if (PaymentMethod === "cash") {
      await users.updateOne(
        { username: req.username },
        { $push: { orders: order._id } }
      );
      return res.status(200).json({
        response_code: 200,
        message: "order placed successfully",
        success: true,
      });
    }
    if (PaymentMethod === "online") {
      const successURL = `${process.env.FRONT_END_URL}/checkout/paymentsuccess?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`;
      const cancelURL = `${process.env.FRONT_END_URL}/checkout/paymentfailure?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`;
      PaymentApis.PaymetGetaway(
        res,
        dbUser,
        ProductInfo,
        order,
        successURL,
        cancelURL
      );
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const dbUser = users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid user" });
    }

    const my_orders = await dbUser.populate("orders");
    if (!my_orders.orders) {
      return res
        .status(300)
        .json({ response_code: 300, message: "no data found" });
    }
    res.status(200).json({
      response_code: 200,
      message: "orders retrived successfully",
      my_orders: my_orders.orders?.reverse(),
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(204)
        .json({ response_code: 204, message: "All fields are required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid user" });
    }
    const selectedOrder = await orders.findOne({ _id: Id });
    if (!selectedOrder) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid order" });
    }
    await orders.updateOne(
      { _id: Id },
      { $set: { delivery_status: "cancelled", cencelled_date: new Date() } }
    );
    res
      .status(200)
      .json({ response_code: 200, message: "order cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateOrderShipmentDate = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(204)
        .json({ response_code: 204, message: "All fields are required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid user" });
    }
    const selectedOrder = await orders.findOne({ _id: Id });
    if (!selectedOrder) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid order" });
    }
    await orders.updateOne(
      { _id: Id },
      { $set: { delivery_status: "shipped", shipment_date: new Date() } }
    );
    res
      .status(200)
      .json({ response_code: 200, message: "order shiped successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateOrderDelivered = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(204)
        .json({ response_code: 204, message: "All fields are required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid user" });
    }
    const selectedOrder = await orders.findOne({ _id: Id });
    if (!selectedOrder) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid order" });
    }
    await orders.updateOne(
      { _id: Id },
      {
        $set: {
          delivery_status: "delivered",
          delivery_date: new Date(),
          payment_status: "paid",
          payment_date: new Date(),
        },
      }
    );
    res
      .status(200)
      .json({ response_code: 200, message: "order delivered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(204)
        .json({ response_code: 204, message: "All fields are required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid user" });
    }
    const selectedOrder = await orders.findOne({ _id: Id });
    if (!selectedOrder) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid order" });
    }
    function expDelivaryDate(timestamp) {
      if (!selectedOrder.shipment_date) {
        const date = new Date(selectedOrder.order_date);
        date.setTime(date.getTime() + 6 * 24 * 60 * 60 * 1000);
        return date;
      }
      if (!timestamp) return null;
      const date = new Date(timestamp);
      date.setTime(date.getTime() + 3 * 24 * 60 * 60 * 1000);
      // const newDateISO = date.toISOString();
      return date;
    }
    function expShippmentDate(timestamp) {
      if (!timestamp) return null;
      const date = new Date(timestamp);
      date.setTime(date.getTime() + 3 * 24 * 60 * 60 * 1000);
      // const newDateISO = date.toISOString();
      return date;
    }
    let activeStatus;
    switch (selectedOrder.delivery_status) {
      case "order confirmed":
        activeStatus = 1;
        break;
      case "shipped":
        activeStatus = 3;
        break;
      case "delivered":
        activeStatus = 4;
        break;

      default:
        activeStatus = 0;
        break;
    }
    const steps = [
      {
        label: "Order Confirmed",
        date: selectedOrder.order_date.toString().slice(4, 24),
        description: `Your order has been successfully confirmed. We are preparing it for shipment.`,
      },
      {
        label: selectedOrder.shipment_date ? "Shipped" : "Shipment Pending",
        date: selectedOrder.shipment_date
          ? selectedOrder.shipment_date.toString().slice(4, 24)
          : `Expected shipment date : ${expShippmentDate(
              selectedOrder.order_date
            )
              .toString()
              .slice(4, 24)}`,
        description: selectedOrder.shipment_date
          ? "Your order has been shipped. It is on its way to you."
          : `We are preparing your order for shipping.`,
      },
      {
        label: "Out for delivery",
        date: selectedOrder.shipment_date
          ? selectedOrder.shipment_date.toString().slice(4, 24)
          : null,
        description: selectedOrder.shipment_date
          ? "Your order is now out for delivery. Expect it at your door shortly."
          : "Your order is on the way and will reach you soon.",
      },
      {
        label: selectedOrder.delivery_date ? "Deliverd" : "Delivery Pending",
        date: selectedOrder.delivery_date
          ? selectedOrder.delivery_date.toString().slice(4, 24)
          : null,
        // : `${expDelivaryDate(selectedOrder.shipment_date)}`,
        description: selectedOrder.delivery_date
          ? "Your item has been delivered."
          : `Expected Delivery on : ${expDelivaryDate(
              selectedOrder.shipment_date
            )
              .toString()
              .slice(4, 24)}`,
      },
    ];

    res.status(200).json({
      response_code: 200,
      message: "Order history retrived successfully",
      steps,
      activeStatus,
    });
  } catch (error) {
    console.log("err", error);

    res.status(500).json({ message: "Internal server error", error });
  }
};
const ordersController = {
  postOrder,
  getMyOrders,
  cancelOrder,
  updateOrderShipmentDate,
  updateOrderDelivered,
  getOrderHistory,
};

module.exports = ordersController;
