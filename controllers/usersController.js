const users = require("../models/usersModel");
const addresses = require("../models/addressModel");
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

// const editShippingAddress=async(req,res)=>{
//   try {
//     const {
//       Id,
//       Name,
//       AddressLine1,
//       AddressLine2,
//       City,
//       State,
//       ZipCode,
//       Email,
//       Phone,
//       Primary,
//     } = req.body;
//     if (
//       !Id ||
//       !Name ||
//       !AddressLine1 ||
//       !City ||
//       !State ||
//       !ZipCode ||
//       !Phone ||
//       !AddressLine2 ||
//       !Email
//     ) {
//       return res
//         .status(204)
//         .json({ response_code: 204, message: "All fields are required" });
//     }
//     const dbUser = await users.findOne({ username: req.username });
//     if (!dbUser) {
//       return res
//         .status(404)
//         .json({ response_code: 404, message: "Invalid user" });
//     }

//     const newAddress = {
//       name: Name,
//       address_line1: AddressLine1,
//       address_line2: AddressLine2,
//       city: City,
//       state: State,
//       zip_code: ZipCode,
//       email: Email,
//       phone: Phone,
//       primary: Primary,
//     };

//     await users.updateOne({username:username},{$set:{

//     }})
//   }catch(err){
//     res.status(500).json({message:'Internal server error'})
//   }
// }

const usersController = {
  createUser,
  login,
  getUserData,
  updateName,
  userMailUpdate,
  updatePassword,
  addMobileNumber,
  updateUsername,
  addShippingAddress,
};

module.exports = usersController;
