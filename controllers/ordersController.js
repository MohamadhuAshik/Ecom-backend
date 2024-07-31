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

const ordersController = {
  postOrder,
  getMyOrders,
  cancelOrder,
  updateOrderShipmentDate,
  updateOrderDelivered,
};

module.exports = ordersController;
