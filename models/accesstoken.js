var mongoose = require("mongoose")

var accessTokenSchema = new mongoose.Schema({
  token: String,
  userID: String,
  clientID: String,
})

module.exports = mongoose.model("AccessToken", accessTokenSchema)
