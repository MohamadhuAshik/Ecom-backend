const mongoose = require("mongoose");
const addressSchema = require("./addressModel");
const cartItemsSchema = require("./cartItemsModel");
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
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    // cart_items: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    cart_items: [cartItemsSchema],
    orders: [{ type: Schema.Types.ObjectId, ref: "Orders" }],
    addresses: [addressSchema],
    my_reviews: [{ type: Schema.Types.ObjectId, ref: "Reviews" }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", usersSchema);
