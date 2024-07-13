const express = require("express")
const app = express()
const cors = require("cors")
require("dotenv").config()
// const cors = require("cors")
const connectDB = require("./config/db")
const routes = require("./routes/route")

const PORT = process.env.PORT || 5000

// middlewares
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"));

// connect to the mongodb database
connectDB()

app.use(routes)

app.listen(PORT, console.log("Server is running on port ", PORT))