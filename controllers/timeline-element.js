// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account.js')
	, Timeline = require('../models/timeline')
	, TimelineElement = require('../models/timeline-element.js');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.list = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		console.log(req.query);

		//Thought.findById(req.user.id, function(err, account) {
		Timeline.findById(req.query['timeline_id'], function(err, timeline) {

			console.log("Error: " + err);

			console.log("Timeline: " + timeline);
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
		});
	}
]

// [Source: http://codahale.com/how-to-safely-store-a-password/]
var Thought = require('../models/thought');
exports.create = [
	passport.authenticate('bearer', { session: false }),
	function createTimelineElement(thoughtElementTemplate, thought, next) {
        // Create timeline element
        var timelineElement = new TimelineElement({
          timeline: timelineId,
          elementType: 'Thought',
          element: thought
        });

        // Save timeline element to datastore
        timelineElement.save(function(err, timelineElement) {
          if (err) {
            console.log('Error creating timeline element: ' + timelineElement);
          }
          console.log('Created timeline element: ' + timelineElement);
          //socketio.sockets.emit('timeline_element', timeline_element);




          // Create thought element
          next(thoughtElementTemplate, thought);
          //createThoughtElement(thought2);
        });
      }
]