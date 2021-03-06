// data access object
let users
let sessions

export default class UserDAO {
  static async injectDB(conn) {
    if (users && sessions) {
      return
    }

    try {
      users = await conn.db(process.env.TYPING_DB).collection("users")
      sessions = await conn.db(process.env.TYPING_DB).collection("sessions")
    } catch (e) {
      console.log(`Unable to establish collection handles in User Model: ${e}`)
    }
  }

  static async getUser(email) {
    return await users.findOne({ email })
  }

  static async addUser(userInfo) {
    try {
      const { ops } = await users.insertOne({ ...userInfo })
      return ops[0]
    } catch (e) {
      return { error: e }
    }
  }

  static async loginUser(email, jwt) {
    try {
      const session = await sessions.updateOne(
        {
          user_id: email,
        },
        {
          $set: {
            jwt,
          },
        },
        {
          upsert: true,
        }
      )
      return { success: true }
    } catch (e) {
      return { error: e }
    }
  }
}
