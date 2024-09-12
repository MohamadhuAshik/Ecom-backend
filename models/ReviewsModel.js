const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewsSchema = mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  rating: { type: Number, required: true },
  review_title: { type: String, required: true },
  review_body: { type: String, required: true },
  review_date: { type: Date, default: new Date() },
  review_images: { type: Array },
  likes: { type: Array },
  dislikes: { type: Array },
});

module.exports = mongoose.model("Reviews", reviewsSchema);
