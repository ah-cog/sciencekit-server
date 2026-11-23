var mongoose = require("mongoose")

var accountSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  name: String,
})

module.exports = mongoose.model("Account", accountSchema)
