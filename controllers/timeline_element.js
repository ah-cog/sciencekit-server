// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account.js')
	, Timeline = require('../models/timeline')
	, TimelineElement = require('../models/timeline_element.js');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.list = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		// Timeline.

		console.log(req.query);

		//Thought.findById(req.user.id, function(err, account) {
		Timeline.findById(req.query['timeline_id'], function(err, timeline) {

			console.log("error: " + err);

			console.log("timeline: " + timeline);
		//Timeline.find({}).populate('author').exec(function(err, thoughts) {

			// Get timeline elements
			//TimelineElement.find({}).populate('author').exec(function(err, elements) {
			TimelineElement.find({ timeline: timeline.id }, function(err, elements) {

				console.log("elements: " + elements);

				// Populate the timeline
				elements.forEach(function (element) {

					console.log('%s is a %s', element, element.elementType);
					TimelineElement.populate(element, { path: 'element', model: element.elementType });

				});

				res.json(elements);

			});
			// res.json(thoughts);
			// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
		});
	}
]

// [Source: http://codahale.com/how-to-safely-store-a-password/]
var Photo = require('../models/photo');
exports.create = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		// Thought.find({}, function(err, thoughts) {
		// 	// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })

		// 	thoughts.forEach(function(thought) {

		// 		// Create timeline element
		// 		var timeline_element = new TimelineElement({
		// 			timeline: '5156b399cefe76e37d000001',
		// 			elementType: 'Thought',
		// 			element: thought
		// 		});

		// 		// Save timeline element to datastore
		// 		timeline_element.save(function(err, timeline_element) {
		// 			if (err) {
		// 				console.log('Error creating timeline element: ' + timeline_element);
		// 			}
		// 			console.log('Created timeline: ' + timeline_element);
		// 			//socketio.sockets.emit('timeline_element', timeline_element);
		// 		});

		// 	});

		// 	res.send();
		// });
	}
]