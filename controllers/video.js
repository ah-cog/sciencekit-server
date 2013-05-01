// Controller
// Exports methods for Account model.
var passport = require('passport')
  , socketio = require('socket.io')
  , Account = require('../models/account')
  , VideoFrame = require('../models/frame')
  , Video = require('../models/video')
  , Moment = require('../models/moment')
  , Perspective = require('../models/perspective')
  , Story = require('../models/story');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res, next) {

        console.log("Video Request:");
        console.log(req);

        // Get POST data
        var data     = req.body;
        var timeline = data.timeline;
        console.log("Video Timeline: %s", timeline);

        // Get files
        //console.log(req.files);

        Account.findById(req.user.id, function(err, account) {

            // Create Video template
            var activityTemplate      = {};
            var filenameStart         = req.files.file.path.indexOf("/uploads");
            activityTemplate.file     = req.files.file;
            activityTemplate.uri      = req.files.file.path.substring(filenameStart);
            activityTemplate.timeline = timeline;
            activityTemplate.account  = account;
            if (data.hasOwnProperty('activity'))   activityTemplate.activity   = data.activity;
            if (data.hasOwnProperty('reference')) activityTemplate.reference = data.reference;

            console.log("videoUri = " + activityTemplate.uri);
            console.log(activityTemplate);

            Story.addVideo(activityTemplate, function(err, moment) {
                // io.sockets.emit('video', moment);
                // res.json(moment);

                Story.getOrCreatePerspective(moment.frame, req.user, function (err, perspective) {
                    console.log('Created Perspective: ');
                    console.log(perspective);

                    perspective.activity = moment.frame.last;

                    perspective.save(function(err) {
                        if (err) throw err;

                        //
                        // Populate JSON structure to return based on element types
                        //

                        Perspective.getPopulated2(perspective, function(err, populatedPerspective) {

                            if (populatedPerspective !== null) {
                                // Replace the generic Frame (e.g., ThoughtFrame) with Perspective associated with the generic Frame for the current Account
                                moment.frame = populatedPerspective;
                            }

                            io.sockets.emit('video', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
                            res.json(moment);
                        });

                        
                    });
                });
            });

        });

    }
]