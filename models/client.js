var mongoose = require("mongoose")

var clientSchema = new mongoose.Schema({
  name: String,
  clientId: String,
  clientSecret: String,
})

module.exports = mongoose.model("Client", clientSchema)
