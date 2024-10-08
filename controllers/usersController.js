const users = require("../models/usersModel");
const addresses = require("../models/addressModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const createUser = async (req, res) => {
  try {
    const { FirstName, LastName, Username, Email, Password } = req.body;
    if (!FirstName || !LastName || !Username || !Email || !Password) {
      return res
        .status(204)
        .json({ response_code: 204, message: "All fields are required" });
    }
    const dbuser = await users.findOne({ username: Username });

    if (dbuser) {
      return res.status(200).json({
        response_code: 200,
        message: "username already exists",
        success: false,
      });
    }

    const HashedPassword = await bcrypt.hash(Password, 10);
    const create = new users({
      first_name: FirstName,
      last_name: LastName,
      username: Username,
      email: Email,
      password: HashedPassword,
    });

    await create.save();

    res.status(200).json({
      response_code: 200,
      message: "user created successfully",
      success: true,
    });
  } catch (err) {
    res
      .status(500)
      .json({ response_code: 500, message: "Internal server error", err });
  }
};

const login = async (req, res) => {
  try {
    const { Username, Password } = req.body;
    if (!Username || !Password) {
      return res
        .status(400)
        .json({ response_code: 400, message: "All fields are required" });
    }
    const dbuser = await users.findOne({ username: Username });

    if (!dbuser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid Username" });
    }

    const IsPasswordMatch = await bcrypt.compare(Password, dbuser.password);
    if (IsPasswordMatch) {
      const userData = {
        username: Username,
      };
      const token = jwt.sign(userData, process.env.JWT_SECRET_KEY);
      res.status(200).json({
        response_code: 200,
        message: "login successfully",
        token: token,
      });
    } else {
      res
        .status(401)
        .json({ response_code: 401, message: "Incorrect Password" });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal server error", err });
  }
};

const OtpStorage = {};

const recoverPassword = async (req, res) => {
  try {
    const { Username, Email } = req.body;
    if (!Username || !Email) {
      return res
        .status(400)
        .json({ response_code: 400, message: "All fields are required" });
    }
    const dbUser = await users.findOne({ username: Username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid username" });
    }

    if (dbUser.email !== Email) {
      return res
        .status(400)
        .json({ response_code: 400, message: "email did't match" });
    }

    // const otp = Math.floor(Math.random()*100000)
    const otp = crypto.randomInt(100000, 999999).toString();
    OtpStorage[Email] = { otp, expires: Date.now() + 150000 };
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "prasannadevjlvmts@gmail.com",
        pass: "xdnt yobs jvck maba",
      },
    });

    const mailOptions = {
      from: "prasannadevjlvmts@gmail.com",
      to: Email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      res
        .status(200)
        .json({ response_code: 200, message: "OTP sent successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send OTP" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { Email, Otp, Username } = req.body;
    if (!Email || !Otp || !Username) {
      return res
        .status(400)
        .json({ response_code: 400, message: "All fields are required" });
    }

    if (Object.values(OtpStorage).length === 0) {
      return res.status(200).json({ message: "OtpStorage Is Empty" });
    }
    if (OtpStorage[Email].expires < Date.now()) {
      return res.status(200).json({ message: "OTP Expired" });
    }
    if (OtpStorage[Email].otp === Otp) {
      const payload = {
        username: Username,
        otp: Otp,
        email: Email,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: "2m",
      });
      delete OtpStorage[Email];
      res.status(200).json({
        response_code: 200,
        message: "OTP verified successfully!",
        token,
      });
    } else {
      res
        .status(400)
        .json({ response_code: 400, error: "Invalid OTP or email" });
    }

    // if (
    //   req.session.otp.toString() === Otp.toString() &&
    //   req.session.email === Email
    // ) {
    //   res.status(200).json({ message: "OTP verified successfully!" });
    // } else {
    //   res.status(400).json({ error: "Invalid OTP or email" });
    // }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, Password } = req.body;
    if (!token || !Password) {
      return res
        .status(400)
        .json({ response_code: 400, message: "All fields are required" });
    }
    const decoded_token = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("decoded_token", decoded_token);
    const dbUser = await users.findOne({ username: decoded_token.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "User not found" });
    }
    const HashedNewPassword = await bcrypt.hash(Password, 10);

    await users.updateOne(
      { username: decoded_token.username },
      { $set: { password: HashedNewPassword } }
    );
    res
      .status(200)
      .json({ response_code: 200, message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).send({
        response_code: 401,
        message: "Session expired. Please verify again.",
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

//user details api's

const getUserData = async (req, res) => {
  const userDB = await users.findOne({ username: req.username });
  if (!userDB) {
    return res
      .status(404)
      .json({ response_code: 404, message: "user not found" });
  }
  const userData = {
    id: userDB._id,
    first_name: userDB.first_name,
    last_name: userDB.last_name,
    username: userDB.username,
    email: userDB.email,
    mobile_number: userDB.mobile_number || "",
    wishlist: userDB.wishlist,
    cart_items: userDB.cart_items,
    orders: userDB.orders,
    addresses: userDB.addresses,
  };
  res.status(200).json({ response_code: 200, userData });
};

const updateName = async (req, res) => {
  try {
    const { FirstName, LastName } = req.body;
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({ message: "user not found" });
    }
    await users.updateOne(
      { username: req.username },
      {
        $set: {
          first_name: FirstName,
          last_name: LastName,
        },
      }
    );

    res
      .status(200)
      .json({ response_code: 200, message: "name updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const userMailUpdate = async (req, res) => {
  try {
    const { Email } = req.body;
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({ message: "user not found" });
    }

    await users.updateOne(
      { username: req.username },
      {
        $set: {
          email: Email,
        },
      }
    );
    res
      .status(200)
      .json({ response_code: 200, message: "email updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { OldPassword, NewPassword } = req.body;
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "user not found" });
    }

    const IsPasswordMatch = await bcrypt.compare(OldPassword, dbUser.password);
    console.log("IsPasswordMatch", IsPasswordMatch);
    if (!IsPasswordMatch) {
      return res
        .status(300)
        .json({ response_code: 300, message: "Wrong password" });
    }
    const HashedNewPassword = await bcrypt.hash(NewPassword, 10);
    await users.updateOne(
      { username: req.username },
      {
        $set: {
          password: HashedNewPassword,
        },
      }
    );

    res
      .status(200)
      .json({ response_code: 200, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const addMobileNumber = async (req, res) => {
  try {
    const { MobileNumber } = req.body;
    if (!MobileNumber) {
      return res
        .status(204)
        .json({ response_code: 204, message: "all fields are required" });
    }
    const dbUser = await users.findOne({ username: req.username });

    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "user not found" });
    }
    await users.updateOne(
      { username: req.username },
      {
        $set: {
          mobile_number: MobileNumber,
        },
      }
    );
    res.status(200).json({
      response_code: 200,
      message: "Mobile number added successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUsername = async (req, res) => {
  try {
    const { Username } = req.body;
    if (!Username) {
      return res
        .status(204)
        .json({ response_code: 204, message: "All fields are required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "user not found" });
    }
    const user = await users.findOne({ username: Username });

    if (user) {
      return res
        .status(201)
        .json({ response_code: 201, message: "username already exists" });
    }
    await users.updateOne(
      { username: req.username },
      { $set: { username: Username } }
    );

    const userData = {
      username: Username,
    };
    const newToken = jwt.sign(userData, process.env.JWT_SECRET_KEY);

    res.status(200).json({
      response_code: 200,
      message: "username updated successfully",
      newToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//shipping address api's

const addShippingAddress = async (req, res) => {
  try {
    const {
      Name,
      AddressLine1,
      AddressLine2,
      City,
      State,
      ZipCode,
      Email,
      Phone,
      Primary,
    } = req.body;
    if (
      !Name ||
      !AddressLine1 ||
      !City ||
      !State ||
      !ZipCode ||
      !Phone ||
      !AddressLine2 ||
      !Email
    ) {
      return res
        .status(204)
        .json({ response_code: 204, message: "All fields are required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid user" });
    }

    const newAddress = {
      name: Name,
      address_line1: AddressLine1,
      address_line2: AddressLine2,
      city: City,
      state: State,
      zip_code: ZipCode,
      email: Email,
      phone: Phone,
      primary: Primary,
    };
    console.log("newAddress", newAddress);
    await users.updateOne(
      { username: req.username },
      { $push: { addresses: newAddress } }
    );
    // console.log("add", add);
    res
      .status(200)
      .json({ response_code: 200, message: "Address added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", err });
  }
};

const editShippingAddress = async (req, res) => {
  try {
    const {
      Id,
      Name,
      AddressLine1,
      AddressLine2,
      City,
      State,
      ZipCode,
      Email,
      Phone,
      Primary,
    } = req.body;
    if (
      !Id ||
      !Name ||
      !AddressLine1 ||
      !City ||
      !State ||
      !ZipCode ||
      !Phone ||
      !AddressLine2 ||
      !Email
    ) {
      return res
        .status(204)
        .json({ response_code: 204, message: "All fields are required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid user" });
    }

    const newAddress = {
      name: Name,
      address_line1: AddressLine1,
      address_line2: AddressLine2,
      city: City,
      state: State,
      zip_code: ZipCode,
      email: Email,
      phone: Phone,
      primary: Primary,
    };

    await users.updateOne(
      { username: req.username },
      {
        $set: {
          "addresses.$[outer]": newAddress,
        },
      },
      {
        arrayFilters: [{ "outer._id": Id }],
      }
    );

    res
      .status(200)
      .json({ response_code: 200, message: "address updated successfully" });
  } catch (err) {
    console.log("err", err);
    res.status(500).json({ message: "Internal server error", err });
  }
};

const deleteShippingAddress = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res.status(300).json({
        response_code: 300,
        message: "Id is required to delete the address",
      });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid username" });
    }
    await users.updateOne(
      { username: req.username },
      { $pull: { addresses: { _id: Id } } }
    );
    res
      .status(200)
      .json({ response_code: 200, message: "Address deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error", err });
  }
};

const setPrimaryAddress = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res.status(300).json({
        response_code: 300,
        message: "Id is required to delete the address",
      });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid username" });
    }

    await users.updateOne(
      { username: req.username },
      { $set: { "addresses.$[].primary": false } }
    );

    await users.updateOne(
      { username: req.username },
      { $set: { "addresses.$[outer].primary": true } },
      { arrayFilters: [{ "outer._id": Id }] }
    );
    // await users.updateOne(
    //   { username: req.username, "addresses._id": Id },
    //   { $set: { "addresses.$.primary": Primary } }
    // );

    res
      .status(200)
      .json({ response_code: 200, message: "address setted as primary" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const removePrimaryAddress = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res.status(300).json({
        response_code: 300,
        message: "Id is required to delete the address",
      });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid username" });
    }

    await users.updateOne(
      { username: req.username },
      { $set: { "addresses.$[outer].primary": false } },
      { arrayFilters: [{ "outer._id": Id }] }
    );

    res
      .status(200)
      .json({ response_code: 200, message: "address removed as primary" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//cart api's

const addToCart = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(400)
        .json({ response_code: "400", message: "Id is required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({ message: "Invalid user" });
    }

    const isExistingItem = dbUser.cart_items.find(
      (item) => item.Id.toString() === Id
    );
    console.log("isExistingItem", isExistingItem);
    if (isExistingItem) {
      return res.status(201).json({
        response_code: 201,
        message: "Item already exists",
        isExistingItem,
      });
    }
    const cartItem = {
      Id: Id,
      // Id: mongoose.Types.ObjectId(Id),
      count: 1,
    };
    await users.updateOne(
      { username: req.username },
      { $push: { cart_items: cartItem } }
      // { $push: { cart_items: Id } }
    );
    res
      .status(200)
      .json({ response_code: 200, message: "Item added successfully" });
  } catch (err) {
    console.log("err", err);
    res.status(500).json({ message: "Internal server error", err });
  }
};

const getCartItems = async (req, res) => {
  try {
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Invalid username" });
    }
    // const userWithCartItems = await users
    //   .where("username")
    //   .equals(req.username)
    //   .populate("cart_items");
    const userWithCartItems = await users
      .findOne({ username: req.username })
      .populate("cart_items.Id");

    const transformedCartItems = userWithCartItems.cart_items.map((item) => ({
      ...item.Id._doc,
      count: item.count,
      cartItemId: item._id, // Keeping track of the cart item's unique id in the cart
    }));
    res.status(200).json({
      response_code: 200,
      message: "cart items retrived successfully",
      cart_items: transformedCartItems?.reverse(),
      // cart_items: userWithCartItems.cart_items,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(400)
        .json({ response_code: "400", message: "Id is required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({ message: "Invalid user" });
    }

    await users.updateOne(
      { username: req.username },
      { $pull: { cart_items: { Id: Id } } }
    );

    res
      .status(200)
      .json({ response_code: 200, message: "Item removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const increaseCartItemCount = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(400)
        .json({ response_code: "400", message: "Id is required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({ message: "Invalid user" });
    }
    const isExistingItem = dbUser.cart_items.find(
      (item) => item.Id.toString() === Id
    );
    console.log("isExistingItem", isExistingItem);
    if (!isExistingItem) {
      return res.status(201).json({
        response_code: 201,
        message: "Item doesn't exist in the cart",
      });
    }
    await users.updateOne(
      { username: req.username },
      {
        $inc: {
          "cart_items.$[outer].count": 1,
        },
      },
      { arrayFilters: [{ "outer.Id": Id }] }
    );

    res.status(200).json({ response_code: 200, message: "Item incremented" });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const decreaseCartItemCount = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(400)
        .json({ response_code: "400", message: "Id is required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({ message: "Invalid user" });
    }
    const isExistingItem = dbUser.cart_items.find(
      (item) => item.Id.toString() === Id
    );
    if (!isExistingItem) {
      return res.status(201).json({
        response_code: 201,
        message: "Item doesn't exist in the cart",
      });
    }
    if (isExistingItem.count <= 1) {
      return res.status(400).json({
        response_code: 400,
        message: "Item count cannot be less than 1",
      });
    }
    await users.updateOne(
      { username: req.username },
      { $inc: { "cart_items.$[outer].count": -1 } },
      { arrayFilters: [{ "outer.Id": Id }] }
    );

    res.status(200).json({ response_code: 200, message: "Item decremented" });
  } catch (err) {
    console.log("err", err);
    res.status(500).json({ message: "Internal server error", err });
  }
};

//wishlist api's

const addToFavourites = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(400)
        .json({ response_code: 400, message: "Id is required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({
        response_code: 404,
        message: "Invalid userid or token missing",
      });
    }
    await users.updateOne(
      { username: req.username },
      { $push: { wishlist: Id } }
    );
    res
      .status(200)
      .json({ response_code: 200, message: "Item added successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ response_code: 500, message: "Internal server error" });
  }
};

const getFavouriteItems = async (req, res) => {
  try {
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({
        response_code: 404,
        message: "Invalid userid or token missing",
      });
    }

    const wishlist_items = await dbUser.populate("wishlist");
    // const wishlist_items = await users
    //   .findOne({ username: req.username })
    //   .populate("wishlist");
    res.status(200).json({
      response_code: 200,
      message: "favourite items retrived successfully",
      wishlist: wishlist_items.wishlist?.reverse(),
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const removeFromFavourites = async (req, res) => {
  try {
    const { Id } = req.body;
    if (!Id) {
      return res
        .status(400)
        .json({ response_code: 400, message: "Id is required" });
    }
    const dbUser = await users.findOne({ username: req.username });
    if (!dbUser) {
      return res.status(404).json({
        response_code: 404,
        message: "Invalid userid or token missing",
      });
    }
    await users.updateOne(
      { username: req.username },
      { $pull: { wishlist: Id } }
    );
    res
      .status(200)
      .json({ response_code: 200, message: "Item removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//reviews

const usersController = {
  createUser,
  login,
  recoverPassword,
  verifyOTP,
  resetPassword,
  getUserData,
  updateName,
  userMailUpdate,
  updatePassword,
  addMobileNumber,
  updateUsername,
  addShippingAddress,
  editShippingAddress,
  deleteShippingAddress,
  setPrimaryAddress,
  removePrimaryAddress,
  addToCart,
  getCartItems,
  removeFromCart,
  increaseCartItemCount,
  decreaseCartItemCount,
  addToFavourites,
  getFavouriteItems,
  removeFromFavourites,
};

module.exports = usersController;
