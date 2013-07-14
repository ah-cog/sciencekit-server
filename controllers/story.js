var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Story = require('../models/story')
    , Page = require('../models/page')
	, Inquiry = require('../models/inquiry')
    , Timeline = require('../models/timeline');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        // Get POST data
        var data = req.body;

        Account.findById(req.user.id, function(err, account) {

            // Create Story template
            var storyTemplate = {};
            storyTemplate.account = account;
            // if (data.hasOwnProperty('timeline')) storyTemplate.timeline = timeline;
            storyTemplate.title = data['title'];
            storyTemplate.entries = data['entries'];
            // if (data.hasOwnProperty('activity'))   activityTemplate.activity   = data.activity;
            // if (data.hasOwnProperty('reference')) activityTemplate.reference = data.reference;


            Inquiry.addStory(storyTemplate, function(err, story) {
                io.sockets.emit('story', story); // TODO: is this the wrong place?  better place?  guaranteed here?
                res.json(story);
            });
            
        });
    }
];

exports.read = [
    passport.authenticate('bearer', { session: false }),
    function(req, res, next) {

        // Get requested activity type from URI
        // e.g., /api/<activityType>/tag
        // var activityType = req.params.activityType;

        // Get Timeline ID
        var timelineId = req.query.timelineId;
        //var frameType = activityType.charAt(0).toUpperCase() + activityType.slice(1) + 'Frame';
        console.log('Getting Story for Timeline ' + timelineId);

        if (timelineId) {

            Account.findById(req.user.id, function(err, account) {

                var result = [];

                Story.find({ timeline: timelineId, author: account }).sort('-date').exec(function(err, stories) {
                    if (err) throw err;

                    console.log('Got Story count: ' + stories.length);
                    var storyCount = stories.length;

                    stories.forEach(function (story, storyIndex) {

                        var storyObject = story.toObject();
                        storyObject.pages = [];

                        //var storyResult = { story: story, pages: [] };


                        // TODO: Populate Entry for Page?



                        // // res.json(result); // TODO: Remove this

                        // result.push(storyObject);

                        // storyCount--;

                        // if (storyCount <= 0) {

                        //     res.json(result);

                        // } else {
                        //     // res.json(result);
                        // }

                        // // // Return result
                        // // result.pages = pages;
                        // // res.json(result);










                        // TODO: Request Pages in Story and store in response
                        Page.find({ story: story._id, author: account }).sort('date').exec(function(err, pages) {
                            if (err) throw err;

                            // Populate the timeline
                            var pageCount = pages.length; // Hacky solution used to force synchronous operation. Optimize!
                            console.log(pageCount);

                            // Create Story object to populate and return
                            storyObject.pages = pages;

                            if (pageCount > 0) {
                                pages.forEach(function (page) {

                                    // Populate the Entry for the Page
                                    page.populate({ path: 'entry', model: page.entryType }, function(err, pagePopulated) {

                                        // if (pagePopulated !== null && pagePopulated.entry !== null) {

                                        page.populate({ path: 'author' }, function(err, pagePopulated) {

                                            if (pagePopulated !== null && pagePopulated.entry !== null) {

                                                pageCount--;

                                                if(pageCount <= 0) {


                                                    // TODO: Populate Entry for Page?



                                                    // res.json(result); // TODO: Remove this

                                                    //result.push(storyObject);
                                                    result[storyIndex] = storyObject;

                                                    storyCount--;

                                                    if (storyCount <= 0) {

                                                        res.json(result);

                                                    } else {
                                                        // res.json(result);
                                                    }

                                                    // // Return result
                                                    // result.pages = pages;
                                                    // res.json(result);
                                                }

                                            } else {
                                                pageCount--;
                                                if(pageCount <= 0) {

                                                    // Return result
                                                    // result.pages = pages;
                                                    res.json(result);
                                                }
                                            }
                                        });
                                    });
                                });

                            } else {
                                result[storyIndex] = storyObject;
                                // result.push(storyObject);

                                storyCount--;

                                if (storyCount <= 0) {

                                    res.json(result);

                                } else {
                                    // res.json(result);
                                }
                            }

                        });

                    });
                    
                });
            });
        }
    }
];