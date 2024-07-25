const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// const cartItemsSchema = mongoose.Schema({
//   Id: { type: Schema.Types.ObjectId, ref: "Item" },
//   count: Number,
// });

const cartItemsSchema = new Schema({
  Id: { type: Schema.Types.ObjectId, ref: "Item" },
  count: Number,
});

module.exports = cartItemsSchema;
