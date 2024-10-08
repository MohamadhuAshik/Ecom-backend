const Item = require("../models/itemsModel");
const users = require("../models/usersModel");
const reviews = require("../models/ReviewsModel");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const AddReview = async (req, res) => {
  try {
    const { Id, ReviewTitle, ReviewBody, category } = req.body;
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

    const dbItem = await Item.findOne({ _id: Id });
    if (!dbItem) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Item not found" });
    }

    const dbItemRating = dbItem.ratings?.find(
      (data) => String(data.user) === String(dbUser._id)
    );

    if (!dbItemRating) {
      return res.status(300).json({
        response_code: 300,
        message: "user didn't rate the product",
        dbItemRating,
      });
    }

    const dbItemReview = await reviews.findOne({
      user: dbUser._id,
      item: dbItem._id,
    });

    if (dbItemReview) {
      return res.status(300).json({
        response_code: 300,
        message: "user already reviewed this product",
        dbItemReview,
      });
    }

    const images = req.files;
    const URL = images.map((data, index) => {
      const filename = data.filename;
      return {
        Id: index + 1,
        URL: `https://ecom-backend-xu8u.onrender.com/${category}/${filename}`,
      };
    });

    const review = new reviews({
      user: dbUser._id,
      item: Id,
      review_title: ReviewTitle,
      review_body: ReviewBody,
      review_date: new Date(),
      rating: dbItemRating.rating,
      review_images: URL,
    });

    const after_review = await review.save();

    await Item.updateOne({ _id: Id }, { $push: { reviews: after_review._id } });

    await users.updateOne(
      { _id: dbUser._id },
      { $push: { my_reviews: after_review._id } }
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
    const { Id, Page, Limit } = req.body;
    if (!Id || !Page || !Limit) {
      return res
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

    const ratingData = [
      { id: 1, rating: 5, percentage: 0, count: 0, color: "bg-success" },
      { id: 2, rating: 4, percentage: 0, count: 0, color: "bg-success" },
      { id: 3, rating: 3, percentage: 0, count: 0, color: "bg-success" },
      { id: 4, rating: 2, percentage: 0, count: 0, color: "bg-warning" },
      { id: 5, rating: 1, percentage: 0, count: 0, color: "bg-danger" },
    ];

    const totalRating = dbItem.ratings.reduce((acc, rating) => {
      const i = ratingData.findIndex(
        (rating_data) => rating_data.rating === rating.rating
      );
      ratingData[i].count++;
      return (acc = rating.rating + acc);
    }, 0);

    const rating = totalRating / dbItem.ratings.length || 0;

    const maxCount = Math.max(...ratingData.map((rating) => rating.count));

    ratingData.forEach((data) => {
      data.percentage = (data.count / maxCount) * 100;
    });

    const itemReviews = await dbItem.populate({
      path: "reviews",
      populate: {
        path: "user",
        model: "Users",
      },
    });

    const result = {};
    console.log("itemReviews", itemReviews);

    if (!itemReviews.reviews || itemReviews.reviews?.length === 0) {
      return res.status(200).json({
        response_code: 200,
        message: "reviews retrived successfully",
        itemReviews: [],
        rating,
        ratingData,
        maxCount,
      });
    }
    const page = Number(Page);
    const limit = Number(Limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    if (endIndex < itemReviews.reviews.length) {
      result.Next = page + 1;
    }
    if (startIndex > 0) {
      result.Previous = page - 1;
    }
    result.length = itemReviews.reviews.length;
    const data = itemReviews.reviews.reverse().slice(startIndex, endIndex);
    return res.status(200).json({
      response_code: 200,
      message: "reviews retrived successfully",
      // itemReviews: itemReviews.reviews,
      itemReviews: data,
      paginationData: result,
      rating,
      ratingData,
      maxCount,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addLikeToReview = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(400)
        .json({ response_code: 400, message: "All Items required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({
        response_code: 404,
        message: "User not found or missing token",
      });
    }
    const dbReview = await reviews.findOne({ _id: Id });
    if (!dbReview) {
      return res.status(404).json({
        response_code: 404,
        message: "Review not found",
      });
    }

    const isAlreadyLiked = dbReview.likes.find(
      (item) => item.toString() === dbUser._id.toString()
    );
    if (isAlreadyLiked) {
      return res.status(201).json({
        response_code: 201,
        message: "user already liked this review",
        isAlreadyLiked,
      });
    }

    const isAlreadyDisLiked = dbReview.dislikes.find(
      (item) => item.toString() === dbUser._id.toString()
    );
    if (isAlreadyDisLiked) {
      await reviews.updateOne({ _id: Id }, { $pull: { dislikes: dbUser._id } });
    }
    await reviews.updateOne({ _id: Id }, { $push: { likes: dbUser._id } });
    res
      .status(200)
      .json({ response_code: 200, message: "like added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server error" });
  }
};

const addDisLikeToReview = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(400)
        .json({ response_code: 400, message: "All Items required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({
        response_code: 404,
        message: "User not found or missing token",
      });
    }
    const dbReview = await reviews.findOne({ _id: Id });
    if (!dbReview) {
      return res.status(404).json({
        response_code: 404,
        message: "Review not found",
      });
    }

    const isAlreadyDisLiked = dbReview.dislikes.find(
      (item) => item.toString() === dbUser._id.toString()
    );
    if (isAlreadyDisLiked) {
      return res.status(201).json({
        response_code: 201,
        message: "user already disliked this review",
        isAlreadyDisLiked,
      });
    }

    const isAlreadyLiked = dbReview.likes.find(
      (item) => item.toString() === dbUser._id.toString()
    );
    if (isAlreadyLiked) {
      await reviews.updateOne({ _id: Id }, { $pull: { likes: dbUser._id } });
    }

    await reviews.updateOne({ _id: Id }, { $push: { dislikes: dbUser._id } });
    res
      .status(200)
      .json({ response_code: 200, message: "dislike added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server error", error });
  }
};

const reviewsController = {
  AddReview,
  getMyReviews,
  getProductReviews,
  addLikeToReview,
  addDisLikeToReview,
};

module.exports = reviewsController;
