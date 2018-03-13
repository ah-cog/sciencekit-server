var passport = require("passport")
var bcrypt = require("bcrypt")
var Account = require("../models/account")
var Inquiry = require("../models/inquiry")
var Client = require("../models/client")

exports.readOne = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    Account.findById(req.user.id, function(err, account) {
      delete account.password
      res.json(account)
    })
  },
]

exports.read = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    var response = []
    Account.find({}, function(err, accounts) {
      var count = accounts.length

      var requesterAccountObject = req.user.toObject()
      delete requesterAccountObject["password"]
      response.push(requesterAccountObject)

      accounts.forEach(function(account) {
        if (!account._id.equals(req.user._id)) {
          var accountObject = account.toObject()
          delete accountObject["password"]
          response.push(accountObject)
        }

        count--

        if (count <= 0) {
          res.json(response)
        }
      })
    })
  },
]

exports.create = function(req, res) {
  var accountTemplate = req.body

  if (accountTemplate.username !== "" && accountTemplate.password !== "") {
    // Hash the password using bcrypt.
    var workFactor = 10
    bcrypt.genSalt(workFactor, function(err, salt) {
      bcrypt.hash(accountTemplate.password, salt, function(err, hash) {
        var account = new Account({
          username: accountTemplate.username,
          password: hash,
          name: "",
        })
        account.save(function(err, account) {
          if (err) {
            console.log("Error creating account: " + account)
            res.redirect("/signup")
          }
          Client.create(
            {
              name: "ScienceKit Client",
              clientId: "abc123",
              clientSecret: "ssh-secret",
            },
            function(err, client) {
              res.redirect("/login")
            }
          )
        })
      })
    })
  }
}
