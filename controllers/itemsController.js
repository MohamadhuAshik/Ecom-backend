const Item = require("../models/itemsModel");

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
        URL: `http://localhost:${process.env.PORT}/${req.body.category}/${filename}`,
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
const updateItem = (req, res) => {
  res.json({ message: "update Item" });
};

/* DELETE Request handler */
const deleteItem = (req, res) => {
  res.json({ message: "delete Item" });
};

const itemCrud = {
  getItem,
  addItem,
  updateItem,
  deleteItem,
  getAllItems,
};

module.exports = itemCrud;
