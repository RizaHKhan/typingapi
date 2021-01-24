import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import UserDAO from "../model/UserDAO.js"

const hashPassword = async (password) => await bcrypt.hash(password, 10)

export class User {
  constructor({ _id, email, password = {} } = {}) {
    this._id = _id
    this.email = email
    this.password = password
  }

  toJson() {
    return { _id: this._id, email: this.email }
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

  static async decoded(token) {
    return jwt.verify(token, process.env.SECRET_KEY, (error, res) => {
      if (error) {
        return { error }
      }
      return new User(res)
    })
  }
}

export default class UserController {
  static getUser(req, res, next) {
    res.status(200).json({ Welcome: "To Our App" })
  }

  static async register(req, res) {
    try {
      // if user already exists don't bother running the rest of this:
      const userFromBody = req.body

      const userExists = await UserDAO.getUser(userFromBody.email)
      if (userExists) {
        res.status(400).json({ error: "User already exists" })
        return
      }

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

      const userFromDB = await UserDAO.addUser(userInfo)
      if (!userFromDB) {
        errors.push("Unable to register at this time, please try again later")
      }

      if (errors.length > 0) {
        res.sendStatus(400).json(errors)
        return
      }

      const user = new User(userFromDB)
      const token = user.encoded()

      res.json({
        token: user.encoded(),
        user: user.toJson(),
      })
    } catch (e) {
      res.sendStatus(500).json({ error: e })
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body

      if (!email || typeof email !== "string") {
        res.sendStatus(400).json({ error: "Bad email format, expected string" })
        return
      }

      if (!password || typeof password !== "string") {
        res
          .sendStatus(400)
          .json({ error: "Bad password format, expected string" })
        return
      }

      const userData = await UserDAO.getUser(email)

      if (!userData) {
        res.sendStatus(401).json({ error: "Ensure your email is correct" })
        return
      }

      const user = new User(userData)

      if (!(await user.comparePassword(password))) {
        res.sendStatus(401).json({ error: "Incorrect password" })
        return
      }

      const loginResponse = await UserDAO.loginUser(user.email, user.encoded())
      if (!loginResponse.success) {
        res.sendStatus(500).json({ error: "Server Error" })
        return
      }

      res.json({
        token: user.encoded(),
        user: user.toJson(),
      })
    } catch (e) {
      res.sendStatus(400).json({ error: e })
    }
  }

  static async loginUserInfo(req, res) {
    try {
      const userJwt = req.get("Authorization").slice("Bearer ".length)
      const userObj = await User.decoded(userJwt)
      let { error } = userObj
      if (error) {
        res.sendStatus(401).json({ error })
        return
      }
      res.send({ user: userObj })
    } catch (e) {
      res.sendStatus(400).json({ error: e })
    }
  }
}
