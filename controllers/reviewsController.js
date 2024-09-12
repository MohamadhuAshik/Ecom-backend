const Item = require("../models/itemsModel");
const users = require("../models/usersModel");
const reviews = require("../models/ReviewsModel");

const AddReview = async (req, res) => {
  try {
    const { Id, ReviewTitle, ReviewBody } = req.body;
    if (!Id || !ReviewTitle || !ReviewBody) {
      return res
        .status(400)
        .json({ response_code: 400, message: "All fields are required" });
    }

    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({
        response_code: 404,
        message: "User not found or missing token",
      });
    }
    // if(!dbUser.orders.includes(Id)){
    //   return res.status(300).json({response_code:300,message:"user didn't order this item"})
    // }
    const dbItem = await Item.findOne({ _id: Id });
    if (!dbItem) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Item not found" });
    }

    const dbItemRating = dbItem.ratings?.find(
      (data) => String(data.user) === String(dbUser._id)
    );
    console.log("dbItemRating", dbItemRating);
    if (!dbItemRating) {
      return res.status(300).json({
        response_code: 300,
        message: "user didn't rate the product",
        dbItemRating,
      });
    }

    const review = new reviews({
      user: dbUser._id,
      item: Id,
      review_title: ReviewTitle,
      review_body: ReviewBody,
      review_date: new Date(),
      rating: dbItemRating.rating,
    });

    await review.save();

    const reviewItem = await reviews.findOne({ user: dbUser._id, item: Id });
    // console.log("reviewItem", reviewItem);

    await Item.updateOne({ _id: Id }, { $push: { reviews: reviewItem._id } });

    await users.updateOne(
      { _id: dbUser._id },
      { $push: { my_reviews: reviewItem._id } }
    );

    res
      .status(200)
      .json({ response_code: 200, message: "review added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({
        response_code: 404,
        message: "Invalid userid or token missing",
      });
    }

    const myReviews = await users.findOne({ username: req.username }).populate({
      path: "my_reviews",
      populate: {
        path: "item",
        model: "Item",
      },
    });

    res.status(200).json({
      response_code: 200,
      message: "User reviews retrived successfully",
      myReviews: myReviews.my_reviews.reverse(),
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      res
        .status(400)
        .json({ response_code: 400, message: "All fields are required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      res.status(404).json({
        response_code: 404,
        message: "Invalid userid or token missing",
      });
    }

    const dbItem = await Item.findOne({ _id: Id });
    if (!dbItem) {
      res.status(404).json({
        response_code: 404,
        message: "Item does't exists",
      });
    }

    const itemReviews = await dbItem.populate("reviews");
    console.log("itemReviews", itemReviews);

    res.status(200).json({
      response_code: 200,
      message: "reviews retrived successfully",
      itemReviews: itemReviews.reviews,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const reviewsController = {
  AddReview,
  getMyReviews,
  getProductReviews,
};

module.exports = reviewsController;
