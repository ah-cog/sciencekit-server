var passport = require("passport")
var login = require("connect-ensure-login")
var controllers = require("../controllers")
var models = require("../models")

exports.index = function(req, res) {
  res.render("index", { title: "ScienceKit", user: req.user })
}

exports.timeline = [
  login.ensureLoggedIn(),
  function(req, res) {
    res.render("timeline", { title: "ScienceKit", user: req.user })
  },
]

exports.signupForm = function(req, res) {
  res.render("signup", {})
}

exports.loginForm = function(req, res) {
  res.render("login", {})
}

exports.login = passport.authenticate("local", {
  successReturnToOrRedirect: "/timeline",
  failureRedirect: "/login",
})

exports.logout = function(req, res) {
  req.logout()
  res.redirect("/")
}

exports.account = [
  login.ensureLoggedIn(),
  function(req, res) {
    res.render("account", { user: req.user })
  },
]
