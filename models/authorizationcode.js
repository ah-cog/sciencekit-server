var mongoose = require("mongoose")

var authorizationCodeSchema = new mongoose.Schema({
  code: String,
  clientID: String,
  redirectURI: String,
  userID: String,
})

module.exports = mongoose.model("AuthorizationCode", authorizationCodeSchema)
