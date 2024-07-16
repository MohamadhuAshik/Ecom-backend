const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address_line1: {
    type: String,
    required: true,
  },
  address_line2: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zip_code: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  primary: {
    type: Boolean,
    required: true,
  },
});

module.exports = addressSchema;
