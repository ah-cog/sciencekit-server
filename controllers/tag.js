// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Tag = require('../models/tag')
    , Moment = require('../models/moment')
	, Story = require('../models/story')
    , Timeline = require('../models/timeline');

exports.read = [
    function(req, res, next) {

        // Get requested activity type from URI
        // e.g., /api/<activityType>/tag
        //var activityType = req.params.activityType;

        // Get Frame ID
        var frameId = req.query.frameId;
        //var frameType = activityType.charAt(0).toUpperCase() + activityType.slice(1) + 'Frame';
        console.log('Getting tags for frame ' + frameId);

        if (frameId) {

            Tag.find({ frame: frameId }, function (err, tags) {
                if (err) throw err;

                console.log('Got tag count: ' + tags.length);

                var result = [];

                var tagCount = tags.length;
                if (tagCount > 0) {

                    tags.forEach(function (tag) {

                        getTagTimeline(tag.text, function(err, timeline) {
                            var tagResult = {};
                            tagResult.timeline = timeline;
                            tagResult.tag = tag;
                            result.push(tagResult);
                            tagCount--;
                            if(tagCount <= 0) {
                                res.json(result);
                            }
                        });
                    });

                } else {
                    res.json(result);
                }
                
            });
        }
    }
]

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            // Get requested activity type from URI
            // e.g., /api/<activityType>/tag
            var activityType = req.params.activityType;

            // Get Tag template
            var template = req.body;
            template.account = account;
            console.log("Received Tag template: ");
            console.log(template);

            //
            // Check if Tag with specified label exists for the Material
            //

            Tag.findOne({ frame: template.frame, text: template.text }, function (err, existingTag) {
                if (err) throw err;

                console.log('Tag:');
                console.log(existingTag);

                //
                // Check if tag exists.  If not, create it.
                //

                if (existingTag === null) {

                    //
                    // Tag doesn't exist.  Create it.
                    //

                    Tag.create({
                        frame: template.frame,
                        //frameType: 
                        text: template.text,
                        account: account

                    }, function(err, tag) {

                        //
                        // Get all Tags with the specified label
                        //

                        Tag.find({ text: template.text }, function(err, tags) {
                            if (err) throw err;

                            if (tags.length === 0) {
                                // TODO: Handle this case.  There should be at least one, since one was just made.  Important to handle this, nonetheless.
                            } else {
                                console.log("Found " + tags.length + " Tags with text.");
                                var tagsWithLabel = [];
                                var tagCount = tags.length;
                                for (var i = 0; i < tagCount; i++) {
                                    tagsWithLabel.push(tags[i]._id);
                                }
                                console.log("tagsWithLabel.length = " + tagsWithLabel.length);
                                console.log(tagsWithLabel);

                                //
                                // Get Moments for the found Tags.  These will be used to find an existing Timeline for the textual tag.
                                //
                                Moment.find({}).where('frame').in(tagsWithLabel).exec(function (err, moments) {
                                    if (err) throw err;

                                    console.log("Moments found for Tag (#): " + moments.length);

                                    if (moments.length === 0) {

                                        //
                                        // Create Timeline and parent Moment for Tag
                                        //

                                        Story.createTimelineByActivity(tag, function(err, timeline) {

                                            //
                                            // Create a Moment for specified Material (e.g., ThoughtFrame) on the Tag's Timeline
                                            //

                                            var frameType = null;
                                            if (template.frameType === 'video') {
                                                frameType = 'VideoFrame';
                                            } else if (template.frameType === 'thought') {
                                                frameType = 'ThoughtFrame';
                                            } else if (template.frameType === 'photo') {
                                                frameType = 'PhotoFrame';
                                            }

                                            Moment.create({
                                                timeline: timeline,
                                                frame: template.frame,
                                                frameType: frameType
                                            }, function (err, moment) {
                                                if (err) throw err;

                                                // TODO: Move this outside of this scope (up one?) to make more asynchronous
                                                res.json(timeline);
                                            });
                                        });

                                    } else {

                                        //
                                        // Find existing Timeline.
                                        //

                                        var momentsForTags = [];
                                        var momentCount = moments.length;
                                        for (var i = 0; i < momentCount; i++) {
                                            momentsForTags.push(moments[i]._id);
                                        }
                                        console.log("momentsForTags.length = " + momentsForTags.length);
                                        console.log(momentsForTags);

                                        Timeline.findOne({}).where('moment').in(momentsForTags).exec(function (err, timeline) {
                                            if (err) throw err;

                                            console.log("timeline = " + timeline);

                                            //
                                            // Create a Moment for specified Material (e.g., ThoughtFrame) on the Tag's Timeline
                                            //

                                            var frameType = null;
                                            if (template.frameType === 'video') {
                                                frameType = 'VideoFrame';
                                            } else if (template.frameType === 'thought') {
                                                frameType = 'ThoughtFrame';
                                            } else if (template.frameType === 'photo') {
                                                frameType = 'PhotoFrame';
                                            }

                                            Moment.create({
                                                timeline: timeline,
                                                frame: template.frame,
                                                frameType: frameType
                                            }, function (err, moment) {
                                                if (err) throw err;

                                                // TODO: Move this outside of this scope (up one?) to make more asynchronous
                                                io.sockets.emit('tag', { timeline: timeline, tag: tag }); // TODO: is this the wrong place?  better place?  guaranteed here?
                                                res.json(timeline);
                                            });

                                            //res.json(activityType + ', ' + template);
                                            // io.sockets.emit('tag', { timeline: timeline, tag: tag }); // TODO: is this the wrong place?  better place?  guaranteed here?
                                            // res.json(timeline);
                                        });

                                    }
                                });
                            }
                        });
                    });
                } else {


                    //
                    // Tag exists.  Find Timeline.
                    //

                    // TODO: Verify integrity of the Tag, associated Moment, associated Timeline.

                    console.log('Tag already exists!');

                    getTagTimeline(template.text, function(err, timeline) {
                        io.sockets.emit('tag', { timeline: timeline, tag: existingTag });
                        res.json(timeline);
                    });
                }
            });
        });
    }
];

function getTagTimeline(tagText, fn) {
    //
    // Get all Tags for a given textual tag
    //
    Tag.find({ text: tagText }, function(err, tags) {
        if (err) throw err;

        if (tags.length === 0) {
            // TODO: Handle this case.  There should be at least one, since one was just made.  Important to handle this, nonetheless.
        } else {
            console.log("Found " + tags.length + " Tags with text.");
            var tagsWithText = [];
            var tagCount = tags.length;
            for (var i = 0; i < tagCount; i++) {
                tagsWithText.push(tags[i]._id);
            }
            console.log("tagsWithText.length = " + tagsWithText.length);
            console.log(tagsWithText);

            //
            // Get Moments for the found Tags.  These will be used to find an existing Timeline for the textual tag.
            //
            Moment.find({}).where('frame').in(tagsWithText).exec(function (err, moments) {
                if (err) throw err;

                console.log("Moments found for Tag (#): " + moments.length);

                if (moments.length === 0) {

                    // No Moment exists for the Tags, so no Timeline exists.
                    fn(null, null);

                } else {
                    //
                    // Find existing Timeline.
                    //

                    var momentsForTags = [];
                    var momentCount = moments.length;
                    for (var i = 0; i < momentCount; i++) {
                        momentsForTags.push(moments[i]._id);
                    }
                    console.log("momentsForTags.length = " + momentsForTags.length);
                    console.log(momentsForTags);

                    Timeline.findOne({}).where('moment').in(momentsForTags).exec(function (err, timeline) {
                        if (err) throw err;

                        console.log("timeline = " + timeline);

                        fn(null, timeline);
                    });

                }
            });
        }
    });
}