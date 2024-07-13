const mongoose = require("mongoose");

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
    cart_items: {
      type: Array,
    },
    orders: {
      type: Array,
    },
    addresses: {
      type: Array,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", usersSchema);
