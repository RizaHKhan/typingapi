import express from "express"
import userController from "../controller/userController.js"

const router = express.Router()
router
  .route("/login")
  .post(userController.login)
  .get(userController.loginUserInfo)
router.route("/register").post(userController.register)

export default router
