import dotenv from "dotenv"
import express from "express"
import morgan from "morgan"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import cors from "cors"
import users from "./routes/users.js"
// import tests from "./routes/tests"


dotenv.config()
const app = express()

app.use(cors())
app.use(cookieParser())
process.env.NODE_ENV !== "prod" && app.use(morgan("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000")
  res.header(
    "Access-Control-Allow-Headers",
    "origin, X-Requested-With, Content-Type, Accept"
  )
  next()
})

// registering routes
app.use("/api/v1/users", users)
// app.use("/api/v1/tests", tests)
//
export default app
