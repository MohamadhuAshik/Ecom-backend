const express = require("express")
const router = express.Router()

const uploadPhoto = require("../middlewares/upload")
const itemCrud = require("../controllers/itemsController")
const paymentControl = require("../controllers/paymentController")


/* Products Api's */

router.get('/api/items', itemCrud.getItem)
router.post('/api/items', uploadPhoto.array('images'), itemCrud.addItem)
router.put('/api/items/:id', itemCrud.updateItem)
router.delete('/api/items/:id', itemCrud.deleteItem)


/* Payment Api's */

router.post('/', paymentControl.initializePayment)
router.get('/verify/:id', paymentControl.verifyPayment)

/* user Api */


module.exports = router