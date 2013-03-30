// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account.js')
	, Timeline = require('../models/timeline')
	, TimelineElement = require('../models/timeline_element.js')
	, Thought = require('../models/thought')
	, Photo = require('../models/photo');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.list = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		//Thought.findById(req.user.id, function(err, account) {
		Timeline.findById(req.query['id'], function(err, timeline) {

			// TODO: Handle "err"

			// Get timeline elements
			// TODO: Optimize.  There's got to be a better way!
			TimelineElement.find({ timeline: timeline.id }).sort('date').exec(function(err, elements) {

				// Populate the timeline
				var count = elements.length; // Hacky. Optimize!
				elements.forEach(function (element) {

					// Populate the elements in the timeline
					// console.log('%s is a %s', element.element, element.elementType);
					element.populate({ path: 'element', model: element.elementType }, function(err, thoughts) {
						count--;
						if(count <= 0) {
							// "callback"
							res.json(elements);
						}
					});

				});
			});
			// res.json(thoughts);
			// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
		});
	}
]

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		//Account.findById(req.user.id, function(err, account) {
		// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })

		// Create timeline
		var timeline = new Timeline({});

		// Save timeline to datastore
		timeline.save(function(err, timeline) {
			if (err) {
				console.log('Error creating timeline: ' + timeline);
			}
			console.log('Created timeline: ' + timeline);

			res.json(timeline);
			//socketio.sockets.emit('timeline', timeline);
		});
		//});



		

		

		// res.send();
	}
]