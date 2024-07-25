const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tempOrdersScheme = mongoose.Schema({
  user_Id: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  shipping_address: { type: Object, required: true },
  billing_info: { type: Object, required: true },
  payment_method: { type: String, required: true },
  product_info: { type: Object, required: true },
  total_amount: { type: Number, required: true },
  payment_id: { type: String },
  payment_status: { type: String, required: true },
  delivery_status: { type: String, required: true },
  order_date: { type: Date, default: new Date() },
  shippemnt_date: { type: Date },
  delivery_date: { type: Date },
  //   estimated_delivery_time: { type: Date },
});

module.exports = mongoose.model("TempOrders", tempOrdersScheme);
