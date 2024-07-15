const users = require("../models/usersModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
        .status(204)
        .json({ response_code: 204, message: "All fields are required" });
    }
    const dbuser = await users.findOne({ username: Username });

    if (!dbuser) {
      return res
        .status(300)
        .json({ response_code: 300, message: "Invalid Username" });
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
        .status(300)
        .json({ response_code: 300, message: "Incorrect Password" });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal server error", err });
  }
};

const usersController = { createUser, login };

module.exports = usersController;
