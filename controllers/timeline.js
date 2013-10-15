// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Timeline = require('../models/timeline')
	, Moment = require('../models/moment')
	, Photo = require('../models/photo')
	, Bump = require('../models/bump')
	, Collaboration = require('../models/collaboration')
	, Identity = require('../models/identity')
	, Question = require('../models/question')
	, Observation = require('../models/observation')
	, Sequence = require('../models/sequence')
	, Inquiry = require('../models/inquiry');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.read = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		// Timeline query conditions
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

			//
			// Get default Timeline
			//

			getTimeline();
		}

		//
		// Construct Timeline JSON object to return to client
		//
		function getTimeline() {
			console.log("Timeline.find() conditions:");
			console.log(conditions);

			// Timeline.findOne(conditions, function(err, timeline) {
			Timeline.findOne(conditions).sort('date').exec(function(err, timeline) {

				console.log(timeline);

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
					var momentConditions = { timeline: timeline.id };
					if (req.query['accountId']) {
						momentConditions['author'] = req.query['accountId'];
					}
					Moment.find(momentConditions).sort('-date').limit(75).exec(function(err, moments) {

						if (moments !== null && moments.length > 0) {

							// Populate the timeline
							var resultEntries = [];
							var count = moments.length; // Hacky solution used to force synchronous operation. Optimize!
							console.log(count);
							moments.forEach(function (moment, momentIndex, momentArray) {

								// Get Questions (if any) for Entry

								Question.find({ parent: moment._id }).sort('-date').exec(function(err, questions) {
									Observation.find({ parent: moment._id }).sort('-date').exec(function(err, observations) {
										Sequence.find({ parent: moment._id }).sort('-date').exec(function(err, sequences) {
											Bump.find({ entry: moment._id }).sort('-date').exec(function(err, bumps) {
												Collaboration.find({ entry: moment._id }).sort('-date').exec(function(err, collaborations) {

													// Populate the Moment on the Timeline
													// moment.populate({ path: 'frame', model: 'Frame' }, function(err, populatedMoment) {
													moment.populate({ path: 'entry', model: moment.entryType }, function(err, momentPopulated) {

														// console.log("momentPopulated");
														// console.log(momentPopulated);

														// if (momentPopulated !== null && momentPopulated.entry !== null) {

														moment.populate({ path: 'author' }, function(err, momentPopulated) {

															// console.log("momentPopulated");
															// console.log(momentPopulated);

															if (momentPopulated !== null && momentPopulated.entry !== null) {

																var entryObject = momentPopulated.toObject();

																// Add to results
																if (questions !== null && questions.length > 0) {
																	entryObject.questions = questions;
																}

																// Add to results
																if (observations !== null && observations.length > 0) {
																	entryObject.observations = observations;
																}

																// Add to results
																if (sequences !== null && sequences.length > 0) {
																	entryObject.sequences = sequences;
																}

																// Add to results
																if (bumps !== null && bumps.length > 0) {
																	entryObject.bumps = bumps;
																}

																// Add Collaboration to results
																if (collaborations !== null && collaborations.length > 0) {
																	entryObject.collaborations = collaborations;
																}

																// resultEntries.push(entryObject);
																resultEntries[(moments.length - momentIndex - 1)] = entryObject;

																count--;

																if(count <= 0) {

																	// Return result
																	result.moments = resultEntries;
																	res.json(result);
																}

															} else {
																count--;
																if(count <= 0) {

																	// Return result
																	result.moments = resultEntries;
																	res.json(result);
																}
															}
														});
													});
												});
											});
										});
									});
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

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.readStoryHack = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		console.log("readStoryHack");

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

			//
			// Get default Timeline
			//

			getTimeline();
		}

		//
		// Construct Timeline JSON object to return to client
		//
		function getTimeline() {
			console.log("Timeline.find() conditions:");
			console.log(conditions);

			// Timeline.findOne(conditions, function(err, timeline) {
			Timeline.findOne(conditions).sort('date').exec(function(err, timeline) {

				console.log(timeline);

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

					var resultEntries = [];
					var bumpEntryCount = 0;

					Bump.find({ account: req.user.id }).sort('-date').exec(function(err, bumps) {
		                if (err) throw err;

		                console.log('Got Bumps count: ' + bumps.length);

		                //var resultEntries = [];
						var count = bumps.length; // Hacky solution used to force synchronous operation. Optimize!
						console.log(count);
						bumps.forEach(function (bump, bumpIndex, bumpArray) {

							console.log("HERE: " + bump.entry);

			                Moment.find({ _id: bump.entry }).sort('-date').exec(function(err, moments) {

			                	console.log("MOMENT COUNT!: " + moments.length);

								if (moments !== null && moments.length > 0) {

									// Populate the timeline
									//var resultEntries = [];
									var count = moments.length; // Hacky solution used to force synchronous operation. Optimize!
									console.log(count);
									moments.forEach(function (moment, momentIndex, momentArray) {

										console.log("moment.author: " + moment.author);
										console.log("req.user.id: " + req.user.id);

										// Get Questions (if any) for Entry

										Question.find({ parent: moment._id }).sort('-date').exec(function(err, questions) {
											Observation.find({ parent: moment._id }).sort('-date').exec(function(err, observations) {
												Sequence.find({ parent: moment._id }).sort('-date').exec(function(err, sequences) {
													Bump.find({ entry: moment._id }).sort('-date').exec(function(err, bumps) {
														Collaboration.find({ entry: moment._id }).sort('-date').exec(function(err, collaborations) {
															// Identity.find({ entry: moment._id }).sort('-date').exec(function(err, bumps) {

																// Populate the Moment on the Timeline
																// moment.populate({ path: 'frame', model: 'Frame' }, function(err, populatedMoment) {
																moment.populate({ path: 'entry', model: moment.entryType }, function(err, momentPopulated) {

																	// console.log("momentPopulated");
																	// console.log(momentPopulated);

																	// if (momentPopulated !== null && momentPopulated.entry !== null) {

																	moment.populate({ path: 'author' }, function(err, momentPopulated) {

																		// console.log("momentPopulated");
																		// console.log(momentPopulated);

																		if (momentPopulated !== null && momentPopulated.entry !== null) {

																			var entryObject = momentPopulated.toObject();

																			// Add to results
																			if (questions !== null && questions.length > 0) {
																				entryObject.questions = questions;
																			}

																			// Add to results
																			if (observations !== null && observations.length > 0) {
																				entryObject.observations = observations;
																			}

																			// Add to results
																			if (sequences !== null && sequences.length > 0) {
																				entryObject.sequences = sequences;
																			}

																			// Add to results
																			if (bumps !== null && bumps.length > 0) {
																				entryObject.bumps = bumps;
																			}

																			// Add Collaboration to results
																			if (collaborations !== null && collaborations.length > 0) {
																				entryObject.collaborations = collaborations;
																			}

																			// resultEntries.push(entryObject);
																			// resultEntries[bumpEntryCount + (moments.length - momentIndex - 1)] = entryObject;
																			resultEntries[bumpEntryCount] = entryObject;
																			// resultEntries[moment.date] = entryObject;
																			// resultEntries[entryObject.id] = entryObject;
																			bumpEntryCount++;

																			count--;

																			if(count <= 0) {

																				// Return result
																				// result.moments = resultEntries;
																				// res.json(result);
																			}

																		} else {
																			count--;
																			if(count <= 0) {

																				// Return result
																				// result.moments = resultEntries;
																				// res.json(result);
																			}
																		}
																	});
																});



															// });
														});
													});
												});
											});
										});

										
									});

								} else {
									//res.json({});
								}
							});
						});

		                // var bumpCount = bumps.length;
		                // if (bumpCount > 0) {

		                //     res.json(bumps);

		                // } else {
		                //     var result = [];
		                //     res.json(result);
		                // }
		                
		            });


					// Get timeline elements
					// TODO: Optimize.  There's got to be a better way! Maybe asynchronous? Maybe use sockets for streaming data back? Create "async" version of API and HTTP request-based one?
					var momentConditions = {
						timeline: timeline.id,
						author: req.user.id
					};

					Moment.find(momentConditions).sort('-date').exec(function(err, moments) {

						if (moments !== null && moments.length > 0) {

							// Populate the timeline
							//var resultEntries = [];
							var count = moments.length; // Hacky solution used to force synchronous operation. Optimize!
							console.log(count);
							moments.forEach(function (moment, momentIndex, momentArray) {

								//console.log("moment.author: " + moment.author);
								//console.log("req.user.id: " + req.user.id);

								// Get Questions (if any) for Entry

								Question.find({ parent: moment._id }).sort('-date').exec(function(err, questions) {
									Observation.find({ parent: moment._id }).sort('-date').exec(function(err, observations) {
										Sequence.find({ parent: moment._id }).sort('-date').exec(function(err, sequences) {
											Bump.find({ entry: moment._id }).sort('-date').exec(function(err, bumps) {
												Collaboration.find({ entry: moment._id }).sort('-date').exec(function(err, collaborations) {
													// Identity.find({ entry: moment._id }).sort('-date').exec(function(err, bumps) {

														// Populate the Moment on the Timeline
														// moment.populate({ path: 'frame', model: 'Frame' }, function(err, populatedMoment) {
														moment.populate({ path: 'entry', model: moment.entryType }, function(err, momentPopulated) {

															// console.log("momentPopulated");
															// console.log(momentPopulated);

															// if (momentPopulated !== null && momentPopulated.entry !== null) {

															moment.populate({ path: 'author' }, function(err, momentPopulated) {

																// console.log("momentPopulated");
																// console.log(momentPopulated);

																if (momentPopulated !== null && momentPopulated.entry !== null) {

																	var entryObject = momentPopulated.toObject();

																	// Add to results
																	if (questions !== null && questions.length > 0) {
																		entryObject.questions = questions;
																	}

																	// Add to results
																	if (observations !== null && observations.length > 0) {
																		entryObject.observations = observations;
																	}

																	// Add to results
																	if (sequences !== null && sequences.length > 0) {
																		entryObject.sequences = sequences;
																	}

																	// Add to results
																	if (bumps !== null && bumps.length > 0) {
																		entryObject.bumps = bumps;
																	}

																	// Add Collaboration to results
																	if (collaborations !== null && collaborations.length > 0) {
																		entryObject.collaborations = collaborations;
																	}

																	// resultEntries.push(entryObject);
																	console.log("ENTRY INDEX: " + bumpEntryCount + (moments.length - momentIndex - 1))
																	//resultEntries[bumpEntryCount + (moments.length - momentIndex - 1)] = entryObject;
																	resultEntries[bumpEntryCount] = entryObject;
																	bumpEntryCount++;

																	count--;

																	if(count <= 0) {

																		// Return result
																		result.moments = resultEntries;
																		res.json(result);
																	}

																} else {
																	count--;
																	if(count <= 0) {

																		// Return result
																		result.moments = resultEntries;
																		res.json(result);
																	}
																}
															});
														});



													// });
												});
											});
										});
									});
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

exports.readEntry = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {

		var entryId = req.params.id;

		console.log('entryId = ' + entryId);

		//
		// Construct Timeline JSON object to return to client
		//
	
		// console.log("Timeline.find() conditions:");
		// console.log(conditions);

		// Timeline.findOne(conditions, function(err, timeline) {
		// Timeline.findOne(conditions).sort('date').exec(function(err, timeline) {

			// console.log(timeline);

			// if (err) {
			// 	return console.log(err);
			// } else {

				// if (timeline === null) {
				// 	console.log('Error: Timeline is null');
				// 	return res.json({});
				// }

				// Check if the Timeline's parent Moment is associated with a Tag.  If so, get all Moments associated with the given Tag.

				// Response
				// var result = {};
				// result._id = timeline._id;
				// result.moment = timeline.moment;

				// Get timeline elements
				// TODO: Optimize.  There's got to be a better way! Maybe asynchronous? Maybe use sockets for streaming data back? Create "async" version of API and HTTP request-based one?
				Moment.findOne({ _id: entryId }, function(err, moment) {

					// if (moments !== null && moments.length > 0) {

						// Populate the timeline
						// var resultEntries = [];
						// var count = moments.length; // Hacky solution used to force synchronous operation. Optimize!
						console.log(moment);
						// moments.forEach(function (moment, momentIndex, momentArray) {

							// Get Questions (if any) for Entry

							Question.find({ parent: moment._id }).sort('-date').exec(function(err, questions) {
								Observation.find({ parent: moment._id }).sort('-date').exec(function(err, observations) {
									Sequence.find({ parent: moment._id }).sort('-date').exec(function(err, sequences) {
										Bump.find({ entry: moment._id }).sort('-date').exec(function(err, bumps) {
											Collaboration.find({ entry: moment._id }).sort('-date').exec(function(err, collaborations) {
												// Identity.find({ entry: moment._id }).sort('-date').exec(function(err, bumps) {


													// Populate the Moment on the Timeline
													// moment.populate({ path: 'frame', model: 'Frame' }, function(err, populatedMoment) {
													moment.populate({ path: 'entry', model: moment.entryType }, function(err, momentPopulated) {

														console.log("momentPopulated");
														console.log(momentPopulated);

														// if (momentPopulated !== null && momentPopulated.entry !== null) {

														moment.populate({ path: 'author' }, function(err, momentPopulated) {

															console.log("momentPopulated");
															console.log(momentPopulated);

															if (momentPopulated !== null && momentPopulated.entry !== null) {

																var entryObject = momentPopulated.toObject();

																// Add to results
																if (questions !== null && questions.length > 0) {
																	console.log("HAS QUESTIONS: " + questions.length);
																	entryObject.questions = questions;
																}

																// Add to results
																if (observations !== null && observations.length > 0) {
																	console.log("HAS OBSERVATIONS: " + observations.length);
																	entryObject.observations = observations;
																}

																// Add to results
																if (sequences !== null && sequences.length > 0) {
																	console.log("HAS SEQUENCES: " + sequences.length);
																	entryObject.sequences = sequences;
																}

																// Add to results
																if (bumps !== null && bumps.length > 0) {
																	console.log("HAS SEQUENCES: " + bumps.length);
																	entryObject.bumps = bumps;
																}

																// Add Collaboration to results
																if (collaborations !== null && collaborations.length > 0) {
																	console.log("HAS COLLABORATIONS: " + collaborations.length);
																	entryObject.collaborations = collaborations;
																}

																// resultEntries.push(entryObject);
																// resultEntries[momentIndex] = entryObject;

																// count--;

																// if(count <= 0) {

																	// Return result
																	// result.moments = moments;
																	// result.moments = resultEntries;
																	res.json(entryObject);
																// }

															} else {
																// count--;
																// if(count <= 0) {

																	// Return result
																	// result.moments = resultEntries;
																	// result.moments = moments;
																	res.json(entryObject);
																// }
															}
														});
													});



												// });
											});
										});
									});
								});
							});

							
						});

					// } else {
					// 	res.json({});
					// }
				// });
			// }
		// });
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