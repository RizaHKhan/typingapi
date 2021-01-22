import express from "express"
import userController from "../controller/userController.js"

const router = express.Router()
router.route("/").get(userController.getUser).post(userController.register)

export default router
