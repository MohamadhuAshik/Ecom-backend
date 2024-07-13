/* 
    * Middleware to uplad images via multer
*/
const multer = require("multer")
const fs = require("fs")
const path = require("path")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // cb(null, `./public/${req.body.category}`)
        const dir = `./public/${req.body.category}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // cb(null, file.fieldname + "-" + Date.now() + ".jpg")
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
})

const upload = multer({ storage: storage })

module.exports = upload