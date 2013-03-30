var passport = require('passport')
  , login = require('connect-ensure-login')
  , controllers = require('../controllers')
  , models = require('../models');

/*
 * GET /index
 */

exports.index = function(req, res){
	console.log(req.user);

	res.render('index', { title: 'ScienceKit', user: req.user });
};

/*
 * GET /timeline
 */

exports.timeline = [
	login.ensureLoggedIn(),
	function(req, res){
		console.log(req.user);

		models.Thought.find({}, function (err, thoughts) {
			if (err) { return done(err); }

			console.log("Thoughts: " + thoughts);
			res.render('timeline', { title: 'ScienceKit', user: req.user, thoughts: thoughts });

		});
	}
]

exports.signupForm = function(req, res) {
	res.render('signup', {});
};

exports.loginForm = function(req, res) {
	res.render('login', {});
};

exports.login = passport.authenticate('local', { successReturnToOrRedirect: '/timeline', failureRedirect: '/login' });

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
}

exports.account = [
  login.ensureLoggedIn(),
  function(req, res) {
    res.render('account', { user: req.user });
  }
]