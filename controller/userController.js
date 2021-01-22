import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import UserDAO from "../model/UserDAO.js"

const hashPassword = async (password) => await bcrypt.hash(password, 10)

export class User {
  constructor({ email, password = {} } = {}) {
    this.email = email
    this.password = password
  }

  toJson() {
    return { email: this.email, password: this.password }
  }

  async comparePassword(plainText) {
    return await bcrypt.compare(plainText, this.password)
  }

  encoded() {
    return jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
        ...this.toJson(),
      },
      process.env.SECRET_KEY
    )
  }
}

export default class UserController {
  static getUser(req, res, next) {
    res.status(200).json({ Welcome: "To Our App" })
  }
  static async register(req, res) {
    try {
      const userFromBody = req.body
      let errors = []

      if (userFromBody && userFromBody.password.length < 5) {
        errors.push("Password must be at least 5 characters long")
      }

      if (userFromBody && userFromBody.password.length > 50) {
        errors.push("Password cannot be more then 50 characters long")
      }

      if (userFromBody && !userFromBody.email.length) {
        errors.push("Email must exist")
      }

      if (errors.length > 0) {
        res.status(400).json(errors)
        return
      }

      const userInfo = {
        ...userFromBody,
        password: await hashPassword(userFromBody.password),
      }

      const insertResult = await UserDAO.addUser(userInfo)
      if (!insertResult.success) {
        errors.push("Unable to register at this time, please try again later")
      }

      const userFromDB = await UserDAO.getUser(userFromBody.email)
      if (!userFromDB) {
        errors.push("Server error, please try again later")
      }

      if (errors.length > 0) {
        res.status(400).json(errors)
        return
      }

      const user = new User(userFromDB)

      res.json({
        auth_token: user.encoded(),
        info: user.toJson(),
      })
    } catch (e) {
      res.sendStatus(500).json({ error: e })
    }
  }
}
