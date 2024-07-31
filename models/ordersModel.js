const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ordersScheme = mongoose.Schema({
  user_Id: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  shipping_address: { type: Object, required: true },
  billing_info: { type: Object, required: true },
  payment_method: { type: String, required: true },
  product_info: { type: Object, required: true },
  total_amount: { type: Number, required: true },
  payment_id: { type: String },
  session_id: { type: String },
  invoice: { type: String },
  payment_status: { type: String, required: true },
  card_details: { type: Object },
  delivery_status: { type: String, required: true },
  order_date: { type: Date, default: new Date() },
  shipment_date: { type: Date },
  delivery_date: { type: Date },
  cencelled_date: { type: Date },
  payment_date: { type: Date },
  //   estimated_delivery_time: { type: Date },
});

module.exports = mongoose.model("Orders", ordersScheme);
