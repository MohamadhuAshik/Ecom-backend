const express = require("express");
const router = express.Router();

const uploadPhoto = require("../middlewares/upload");
const itemCrud = require("../controllers/itemsController");
const paymentControl = require("../controllers/paymentController");
const usersController = require("../controllers/usersController");
const verifyToken = require("../middlewares/Authorization");
const ordersController = require("../controllers/ordersController");
const PaymentApis = require("../PaymentGetaway/PaymentGetaway");
const reviewsController = require("../controllers/reviewsController");

/* Products Api's */

router.get("/api/items", itemCrud.getItem);
router.post("/api/items", uploadPhoto.array("images"), itemCrud.addItem);
router.put(
  "/api/items/:id",
  uploadPhoto.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "productImages", maxCount: 10 },
  ]),
  itemCrud.updateItem
);
router.delete("/api/items/:id", itemCrud.deleteItem);
router.get("/api/getallitems", itemCrud.getAllItems);
router.post("/addrating", verifyToken, itemCrud.AddRating);
router.post("/updatefields", itemCrud.updateFields);

/* Payment Api's */

router.post("/", paymentControl.initializePayment);
router.get("/verify/:id", paymentControl.verifyPayment);

/* user Api */

router.post("/signup", usersController.createUser);
router.post("/login", usersController.login);
router.post("/recover-password", usersController.recoverPassword);
router.post("/verify-otp", usersController.verifyOTP);
router.post("/reset-password", usersController.resetPassword);
router.get("/getuserdata", verifyToken, usersController.getUserData);
router.post("/updatename", verifyToken, usersController.updateName);
router.post("/updateuseremail", verifyToken, usersController.userMailUpdate);
router.post("/updatepassword", verifyToken, usersController.updatePassword);
router.post("/addmobilenumber", verifyToken, usersController.addMobileNumber);
router.post("/updateusername", verifyToken, usersController.updateUsername);
router.post("/addaddress", verifyToken, usersController.addShippingAddress);
router.post("/editaddress", verifyToken, usersController.editShippingAddress);
router.post(
  "/deleteaddress",
  verifyToken,
  usersController.deleteShippingAddress
);
router.post("/setprimary", verifyToken, usersController.setPrimaryAddress);
router.post(
  "/removeprimary",
  verifyToken,
  usersController.removePrimaryAddress
);

//cart api's

router.post("/addtocart", verifyToken, usersController.addToCart);
router.get("/getcartitems", verifyToken, usersController.getCartItems);
router.post("/removefromcart", verifyToken, usersController.removeFromCart);
router.post(
  "/increasecartitemcount",
  verifyToken,
  usersController.increaseCartItemCount
);
router.post(
  "/decreasecartitemcount",
  verifyToken,
  usersController.decreaseCartItemCount
);

//favourite api's
router.post("/addtofavourites", verifyToken, usersController.addToFavourites);
router.get(
  "/getfavouriteitems",
  verifyToken,
  usersController.getFavouriteItems
);
router.post(
  "/removefromfavourites",
  verifyToken,
  usersController.removeFromFavourites
);

//order api's

router.post("/postorder", verifyToken, ordersController.postOrder);

router.get("/getmyorders", verifyToken, ordersController.getMyOrders);
router.post("/cencelmyorders", verifyToken, ordersController.cancelOrder);
router.post("/getorderhistory", verifyToken, ordersController.getOrderHistory);
router.post(
  "/updateshipmentdate",
  verifyToken,
  ordersController.updateOrderShipmentDate
);
router.post(
  "/updatedeliverysuccess",
  verifyToken,
  ordersController.updateOrderDelivered
);

//paycheck
router.post("/paycheck", verifyToken, PaymentApis.payCheck);

router.get("/getmyreviews", verifyToken, reviewsController.getMyReviews);
router.post(
  "/getproductreviews",
  verifyToken,
  reviewsController.getProductReviews
);
router.post(
  "/addreview",
  verifyToken,
  uploadPhoto.array("images"),
  reviewsController.AddReview
);
router.post("/addreviewlike", verifyToken, reviewsController.addLikeToReview);
router.post(
  "/addreviewdislike",
  verifyToken,
  reviewsController.addDisLikeToReview
);

module.exports = router;
