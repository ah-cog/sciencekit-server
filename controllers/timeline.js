// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account.js')
	, Timeline = require('../models/timeline')
	, Moment = require('../models/moment')
	, ThoughtFrame = require('../models/thought-frame')
	, TopicFrame = require('../models/topic-frame')
	, PhotoFrame = require('../models/photo-frame')
	, Photo = require('../models/photo')
	, Thought = require('../models/thought')
	, Story = require('../models/story');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.read = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		conditions = {};
		if (req.query['id']) {
			conditions['_id'] = req.query['id'];

			getTimeline();
		} else if (req.query['moment_id']) {
			conditions['moment'] = req.query['moment_id'];

			getTimeline();
		} else {
			console.log("Lookup up timeline for account: " + req.user.id);
			// Lookup timeline for user
			Moment.findOne({ element: req.user.id, elementType: 'Account' }, function(err, moment) {

				// Create timeline for account if one doesn't exist
				if (moment === null) {

					// Create timeline for account
					Story.createTimelineByElement(req.user, function(err, timeline) {

						Moment.findOne({ element: req.user.id, elementType: 'Account' }, function(err, moment) {
							console.log('Found timeline element:' + moment.id);
							conditions['moment'] = moment.id;

							getTimeline();
						});
					});

				} else {

					console.log('Found Moment:' + moment.id);
					conditions['moment'] = moment.id;

					getTimeline();
				}
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

					// Response
					var result = {};
					result._id = timeline._id;
					result.moment = timeline.moment;

					// Get timeline elements
					// TODO: Optimize.  There's got to be a better way! Maybe asynchronous? Maybe use sockets for streaming data back? Create "async" version of API and HTTP request-based one?
					Moment.find({ timeline: timeline.id }).sort('date').exec(function(err, moments) {
						if (moments !== null && moments.length > 0) {

							// Populate the timeline
							var count = moments.length; // Hacky. Optimize!
							moments.forEach(function (moment) {

								//console.log(element);

								// Populate the moments in the timeline
								// console.log('%s is a %s', element.element, element.elementType);
								moment.populate({ path: 'element', model: moment.elementType }, function(err, populatedElement) {
									if (populatedElement !== null && populatedElement.element !== null) {

										// console.log("==> popped: " + populatedElement);

										// Populate JSON structure to return based on element types

										if(moment.elementType === 'ThoughtFrame') {
											ThoughtFrame.getPopulated2(populatedElement.element, function(err, populatedThoughtFrame) {

												count--;

												if(count <= 0) { // "callback"
													result.moments = moments;
													res.json(result);
												}
											});
											
										} else if(moment.elementType === 'TopicFrame') {
											TopicFrame.getPopulated2(populatedElement.element, function(err, populatedTopicFrame) {

												count--;

												if(count <= 0) { // "callback"
													result.moments = moments;
													res.json(result);
												}
											});
											
										} else if(moment.elementType === 'PhotoFrame') {
											console.log(" POPULATING PHOTO FRAME");
											moment.element.populate({ path: 'latest', model: 'Photo' }, function(err, populatedPhoto) {
												//console.log(populatedThoughtFrame);
												count--;

												if(count <= 0) { // "callback"
													result.moments = moments;
													res.json(result);
												}
											});
										} else if(moment.elementType === 'VideoFrame') {
											console.log("POPULATING VIDEO FRAME");
											moment.element.populate({ path: 'last', model: 'Video' }, function(err, populatedPhoto) {
												count--;

												if(count <= 0) { // "callback"
													result.moments = moments;
													res.json(result);
												}
											});
										} else {
											count--;

											if(count <= 0) {
												// "callback"
												result.moments = moments;
													res.json(result);
											}
										}
									} else {
										count--;
										if(count <= 0) {
											// "callback"
											result.moments = moments;
													res.json(result);
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
			moment: timelineTemplate.moment,
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