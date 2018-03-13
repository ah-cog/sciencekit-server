var mongoose = require("mongoose")

var accountSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
})

module.exports = mongoose.model("Account", accountSchema)
