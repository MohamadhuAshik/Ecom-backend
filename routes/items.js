const express = require("express")
const router = express.Router()

const uploadPhoto = require("../middlewares/upload")
const { getItem, addItem, updateItem, deleteItem } = require("../controllers/itemsController")

router.get('/', getItem)

/* The post request must have a body elemnt with name images */
router.post('/', uploadPhoto.array('images'), addItem)

// router.post("/", uploadPhoto.fields(
//     [
//         { name: 'images', maxCount: 10 },
//         { name: 'primaryimage', maxCount: 1 }
//     ]
// ), addItem)

router.put('/:id', updateItem)

router.delete('/:id', deleteItem)

module.exports = router