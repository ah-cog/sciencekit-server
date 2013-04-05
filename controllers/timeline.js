// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account.js')
	, Timeline = require('../models/timeline')
	, TimelineElement = require('../models/timeline-element')
	, Thought = require('../models/thought')
	, Photo = require('../models/photo')
	, Thought = require('../models/thought')
	, ThoughtElement = require('../models/thought-element');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.read = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		conditions = {};
		if (req.query['id']) {
			conditions['_id'] = req.query['id'];

			getTimeline();
		} else if (req.query['element_id']) {
			conditions['element'] = req.query['element_id'];

			getTimeline();
		} else {
			console.log("Lookup up timeline for account: " + req.user.id);
			// Lookup timeline for user
			TimelineElement.findOne({ element: req.user.id, elementType: 'Account' }, function(err, timelineElement) {
				console.log('Found timeline element:' + timelineElement.id);
				conditions['element'] = timelineElement.id;

				getTimeline();
			});
		}

		function getTimeline() {
			console.log("Timeline.find() conditions:");
			console.log(conditions);

			Timeline.findOne(conditions, function(err, timeline) {
				if (err) {
					return console.log(err);
				} else {

					if (timeline === null) {
						console.log('Error: Timeline is null');
						return res.json({});
					}

					// Get timeline elements
					// TODO: Optimize.  There's got to be a better way! Maybe asynchronous? Maybe use sockets for streaming data back? Create "async" version of API and HTTP request-based one?
					TimelineElement.find({ timeline: timeline.id }).sort('date').exec(function(err, elements) {
						if (elements !== null && elements.length > 0) {

							// Populate the timeline
							var count = elements.length; // Hacky. Optimize!
							elements.forEach(function (element) {

								//console.log(element);

								// Populate the elements in the timeline
								// console.log('%s is a %s', element.element, element.elementType);
								element.populate({ path: 'element', model: element.elementType }, function(err, populatedElement) {
									if (populatedElement !== null && populatedElement.element !== null) {

										// console.log("==> popped: " + populatedElement);

										// Populate JSON structure to return based on element types

										if(element.elementType == 'Thought') {
											Thought.getPopulated2(populatedElement.element, function(err, populatedThought) {

												count--;

												if(count <= 0) { // "callback"
													res.json(elements);
												}
											});

											// populatedElement.element.populate({ path: 'latest', model: 'ThoughtElement' }, function(err, populatedThought) {
											// 	if (populatedThought !== null) {

											// 		populatedThought.populate({ path: 'author' }, function(err, populatedAuthor) {
											// 			if (populatedAuthor !== null) {
											// 				//console.log(populatedThought);
											// 				count--;

											// 				if(count <= 0) { // "callback"
											// 					res.json(elements);
											// 				}
											// 			} else {
											// 				//console.log(populatedThought);
											// 				count--;

											// 				if(count <= 0) { // "callback"
											// 					res.json(elements);
											// 				}
											// 			}
											// 		});
											// 	}
											// });
											
										} else if(element.elementType == 'Photo') {
											populatedElement.element.populate({ path: 'latest', model: 'PhotoElement' }, function(err, populatedThought) {
												//console.log(populatedThought);
												count--;

												if(count <= 0) { // "callback"
													res.json(elements);
												}
											});
										} else {
											count--;

											if(count <= 0) {
												// "callback"
												res.json(elements);
											}
										}
									} else {
										count--;
										if(count <= 0) {
											// "callback"
											res.json(elements);
										}
									}
								});




							});
						} else {
							res.json({});
						}
					});
				}
			});
		}
	}
];

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		var timelineTemplate = req.body;

		// Create timeline
		Timeline.create({
			element: timelineTemplate.element,
			elementType: timelineTemplate.elementType
		}, function(err, timeline) {
			console.log('Creating timeline: ' + timeline);
			if (err) {
				console.log('Error creating timeline: ' + timeline);
			}
			console.log('Created timeline: ' + timeline);

			res.json(timeline);
			io.sockets.emit('timeline', timeline);
		});
	}
];