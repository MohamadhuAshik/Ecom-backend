const express = require("express")
const app = express()
const cors = require("cors")
const path = require("path")
require("dotenv").config()
const connectDB = require("./config/db")
const routes = require("./routes/route")
const bodyParser = require("body-parser")

const PORT = process.env.PORT || 5000

// middlewares
app.use(express.json())
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"));

// connect to the mongodb database
connectDB()

//Checking Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,
        "index.html"
    ))
})

app.use(routes)

app.listen(PORT, console.log("Server is running on port ", PORT))