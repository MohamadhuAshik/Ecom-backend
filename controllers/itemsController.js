const Item = require("../models/itemsModel");
const path = require("path");
const fs = require("fs");
const { set } = require("mongoose");
const users = require("../models/usersModel");

/* GET request handler */
const getItem = async (req, res) => {
  const result = {};
  const items = await Item.find();
  // console.log("items", items)
  if (items.length === 0) {
    return res.status(204).json({ message: "No data Found" });
  }
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  if (endIndex < items.length) {
    result.Next = {
      page: page + 1,
    };
  }
  if (startIndex > 0) {
    result.Previous = {
      page: page - 1,
    };
  }
  result.length = items.length;
  result.data = items.slice(startIndex, endIndex);
  res.status(200).json({ response_code: 200, result });
};

const getAllItems = async (req, res) => {
  try {
    const items = await Item.find();
    if (!items) {
      return res
        .status(201)
        .json({ response_code: 201, message: "No data found" });
    }
    res.status(200).json({ response_code: 200, Data: items });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
/* POST Request handler */
const addItem = async (req, res) => {
  try {
    const highlights = req.body.highlights.split(",");
    const size = req.body.size.split(",");
    const images = req.files;
    // console.log("images", images)
    const URL = images.map((data, index) => {
      const filename = data.filename;
      // console.log("filename", filename)
      return {
        Id: index + 1,
        URL: `https://ecom-backend-xu8u.onrender.com/${req.body.category}/${filename}`,
      };
    });
    // console.log("URL", URL)

    /* The request.body must have all these values */
    const item = {
      name: req.body.name,
      category: req.body.category,
      type: req.body.type,
      color: req.body.color,
      description: req.body.description,
      price: req.body.price,
      image: URL,
      primaryImage: URL[0],
      size: size,
      highlights: highlights,
      detail: req.body.detail,
    };

    if (item) {
      await Item.create(item);
      res
        .status(201)
        .json({ response_code: 200, message: "Items Add Success" });
    } else {
      res
        .status(400)
        .json({ response_code: 400, message: "Unable to add item" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* PUT Request handler */
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productName,
      category,
      productPrice,
      productType,
      productDescription,
      productColor,
      productHighlights,
      productDetails,
      productSize,
    } = req.body;

    if (
      !productName ||
      !category ||
      !productPrice ||
      !productType ||
      !productDescription ||
      !productColor ||
      !productHighlights ||
      !productDetails ||
      !productSize
    ) {
      return res.status(400).json({
        message: "Required fields are missing.",
      });
    }

    const highlights = productHighlights.split(",");
    const size = productSize.split(",");

    /* Already uploaded Item Image Deleted */
    const dbItemData = await Item.findOne({ _id: id });
    const dbPrimaryImages = dbItemData.primaryImage.map((data) => {
      return data.URL;
    });
    const dbProductImages = dbItemData.image.map((data) => {
      return data.URL;
    });

    const dbImages = [...dbPrimaryImages, ...dbProductImages];
    console.log("dbImages", dbImages);
    const uniqueImages = [...new Set(dbImages)];
    console.log("uniqueImages", uniqueImages);

    if (uniqueImages && uniqueImages.length !== 0) {
      uniqueImages.forEach((data) => {
        console.log(data);
        const fileName = path.basename(data);
        console.log(fileName);
        if (fileName) {
          const filePath = path.join(
            __dirname,
            "..",
            "public",
            category,
            fileName
          );
          try {
            fs.unlinkSync(filePath);
            console.log("File deleted successfully");
          } catch (err) {
            console.error("Error deleting file:", err);
          }
        }
      });
    }

    const primaryImageURL = req.files["primaryImage"]
      ? req.files["primaryImage"].map((data, index) => {
        const filename = data.filename;
        return {
          Id: index + 1,
          URL: `https://ecom-backend-xu8u.onrender.com/${category}/${filename}`,
        };
      })
      : [];

    const productImageURL = req.files["productImages"]
      ? req.files["productImages"].map((data, index) => {
        const filename = data.filename;
        return {
          Id: index + 1,
          URL: `https://ecom-backend-xu8u.onrender.com/${category}/${filename}`,
        };
      })
      : [];

    const updatedItems = {
      name: productName,
      category: category,
      color: productColor,
      type: productType,
      description: productDescription,
      price: productPrice,
      size: size,
      highlights: highlights,
      detail: productDetails,
      image: productImageURL,
      primaryImage: primaryImageURL,
    };
    await Item.updateOne({ _id: id }, { $set: updatedItems });

    res.json({ response_code: 200, message: "update Item Successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* DELETE Request handler */
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    /* image Deleted */
    const dbItemData = await Item.findOne({ _id: id });
    const dbPrimaryImages = dbItemData.primaryImage.map((data) => {
      return data.URL;
    });
    const dbProductImages = dbItemData.image.map((data) => {
      return data.URL;
    });

    const dbImages = [...dbPrimaryImages, ...dbProductImages];
    console.log("dbImages", dbImages);
    const uniqueImages = [...new Set(dbImages)];
    console.log("uniqueImages", uniqueImages);

    if (uniqueImages && uniqueImages.length !== 0) {
      uniqueImages.forEach((data) => {
        console.log(data);
        const fileName = path.basename(data);
        console.log(fileName);
        if (fileName) {
          const filePath = path.join(
            __dirname,
            "..",
            "public",
            dbItemData.category,
            fileName
          );
          try {
            fs.unlinkSync(filePath);
            console.log("File deleted successfully");
          } catch (err) {
            console.error("Error deleting file:", err);
          }
        }
      });
    }

    await Item.deleteOne({ _id: id });
    res
      .status(200)
      .json({ response_code: 200, message: "delete Item successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const AddRating = async (req, res) => {
  try {
    const { Id, Rating } = req.body;
    if (!Id || !Rating) {
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

    const rating = {
      user: dbUser._id,
      rating: Rating,
      rating_date: new Date(),
    };

    await Item.updateOne({ _id: Id }, { $push: { ratings: rating } });
    res
      .status(200)
      .json({ response_code: 200, message: "Item rated successfully" });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

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

    const review = {
      user: dbUser._id,
      review_title: ReviewTitle,
      review_body: ReviewBody,
      review_date: new Date(),
    };

    await Item.updateOne({ _id: Id }, { $push: { reviews: review } });
    res
      .status(200)
      .json({ response_code: 200, message: "review added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const itemCrud = {
  getItem,
  addItem,
  updateItem,
  deleteItem,
  getAllItems,
  AddRating,
  AddReview,
};

module.exports = itemCrud;
