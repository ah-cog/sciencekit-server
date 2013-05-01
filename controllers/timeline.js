// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Timeline = require('../models/timeline')
	, Moment = require('../models/moment')
	, Perspective = require('../models/perspective')
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
		} else if (req.query['frameId']) {

			Moment.findOne({ frame: req.query['frameId'] }, function(err, moment) {

				// Create timeline for account if one doesn't exist
				if (moment === null) {

					// TODO: Handle this case.  Should happen, but it might in weird situations!

				} else {

					console.log('Found Moment:' + moment.id);
					conditions['moment'] = moment.id;

					getTimeline();
				}
			});
		} else {
			console.log("Lookup up timeline for account: " + req.user.id);
			// Lookup timeline for user
			Moment.findOne({ frame: req.user.id, frameType: 'Account' }, function(err, moment) {

				// Create timeline for account if one doesn't exist
				if (moment === null) {

					// Create timeline for account
					Story.createTimelineByActivity(req.user, function(err, timeline) {

						Moment.findOne({ frame: req.user.id, frameType: 'Account' }, function(err, moment) {
							console.log('Found timeline frame:' + moment.id);
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

		//
		// Construct Timeline JSON object to return to client
		//
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

					// Check if the Timeline's parent Moment is associated with a Tag.  If so, get all Moments associated with the given Tag.

					// Response
					var result = {};
					result._id = timeline._id;
					result.moment = timeline.moment;

					// Get timeline elements
					// TODO: Optimize.  There's got to be a better way! Maybe asynchronous? Maybe use sockets for streaming data back? Create "async" version of API and HTTP request-based one?
					Moment.find({ timeline: timeline.id }).sort('date').exec(function(err, moments) {
						if (moments !== null && moments.length > 0) {

							// Populate the timeline
							var count = moments.length; // Hacky solution used to force synchronous operation. Optimize!
							console.log(count);
							moments.forEach(function (moment) {

								// Populate the Moment on the Timeline
								moment.populate({ path: 'frame', model: 'Frame' }, function(err, populatedMoment) {

									console.log("populatedMoment");
									console.log(populatedMoment);

									if (populatedMoment !== null && populatedMoment.frame !== null) {

										if (moment.frameType === 'Thought' || moment.frameType === 'Photo' || moment.frameType === 'Video') {

											//
											// Get Perspective for current Account (or create one if none exists)
											//

											Story.getOrCreatePerspective(populatedMoment.frame, req.user, function (err, perspective) {

												//
												// Update inactive Perspective
												//

												//if (perspective.active === true) {
													perspective.activity = moment.frame.last;
													perspective.save(function(err) {
														if (err) throw err;

														// TODO: Make this "synchronous"?  So the Frame that is retreived is always the latest?
													});
												//}

												//
												// Populate JSON structure to return based on element types
												//

												Perspective.getPopulated2(perspective, function(err, populatedPerspective) {

													if (populatedPerspective !== null) {
														// Replace the generic Frame (e.g., ThoughtFrame) with Perspective associated with the generic Frame for the current Account
														moment.frame = populatedPerspective;
													}

													count--;

													if(count <= 0) {

														// Return result
														result.moments = moments;
														res.json(result);
													}
												});								;
											});

										//
										// The Material is not one of the expected Materials
										//

										} else {
											count--;
											if(count <= 0) {

												// Return result
												result.moments = moments;
												res.json(result);
											}
										}

									//
									// The Moment has no Frame
									//

									} else {
										count--;
										if(count <= 0) {

											// Return result
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
			frameType: timelineTemplate.activityType
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