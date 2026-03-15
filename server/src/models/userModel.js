const pool = require("../config/db");

const UserModel = {
  async createUser(userData) {
    const { name, emailAddress, password } = userData;
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, entered_date) 
     VALUES (?, ?, ?, NOW())`,
      [name, emailAddress, password],
    );
    return result.insertId;
  },

  async findUserByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT user_id, name, email, password, active 
     FROM users WHERE email = ? AND active = true`,
      [email],
    );
    return rows[0];
  },

  async updateUser(userId, updateData) {
    const { editedBy, userName, emailAddress, role, active, hashedPassword } =
      updateData;

    const fields = [];
    const params = [];

    if (userName) {
      fields.push("name = ?");
      params.push(userName);
    }

    if (emailAddress) {
      fields.push("emailaddress = ?");
      params.push(emailAddress);
    }
    if (role) {
      fields.push("role = ?");
      params.push(role);
    }
    if (active !== undefined) {
      fields.push("active = ?");
      params.push(active);
    }

    if (hashedPassword) {
      fields.push("password = ?");
      params.push(hashedPassword);
    }

    fields.push("editedby = ?");
    params.push(editedBy);

    fields.push("edited_date = NOW()");

    const sql = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE user_id = ?
    `;

    params.push(userId);

    const [result] = await pool.execute(sql, params);

    return result.affectedRows > 0;
  },
};

module.exports = UserModel;
