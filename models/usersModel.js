const mongoose = require("mongoose");
const addressSchema = require("./addressModel");
const Schema = mongoose.Schema;

const usersSchema = mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    mobile_number: {
      type: Number,
    },
    password: {
      type: String,
      required: true,
    },
    wishlist: {
      type: Array,
    },
    cart_items: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    orders: {
      type: Array,
    },
    addresses: [addressSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", usersSchema);
