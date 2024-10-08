/* Schema for the Item document */

// const { type } = require("express/lib/response")
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const reviewsSchema = require("./ReviewsModel");
// const reviewsSchema = require("./ReviewsModel");
// const AutoIncrement = require('mongoose-sequence')(mongoose);

const itemSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    offer: {
      type: Number,
    },
    delivery_charge: {
      type: Number,
    },
    delivery_time: {
      type: Number,
    },
    size: {
      type: Array,
      required: true,
    },
    highlights: {
      type: Array,
      required: true,
    },
    detail: {
      type: String,
      required: true,
    },
    image: {
      type: Array,
      // required: true
    },
    primaryImage: {
      type: Array,
      required: true,
    },
    ratings: {
      type: Array,
    },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Reviews" }],
  },
  {
    timestamps: true,
  }
);

// itemSchema.plugin(AutoIncrement, { inc_field: 'Id' });

module.exports = mongoose.model("Item", itemSchema);
