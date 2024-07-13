const express = require("express")
const router = express.Router()
// const cors = require("cors")
const { initializePayment, verifyPayment } = require("../controllers/paymentController")

// initialize payment endpoint
router.post('/', initializePayment)

// verfiy payment endpoint
router.get('/verify/:id', verifyPayment)

module.exports = router