// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Thought = require('../models/thought')
    , Perspective = require('../models/perspective')
	, Story = require('../models/story');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var thoughtTemplate = req.body;
            thoughtTemplate.account = account;
            console.log("Received: ");
            console.log(thoughtTemplate);
            console.log("Timeline = %s", thoughtTemplate.timeline);

            // TODO: Verify valid JSON
            // TODO: Verify required fields for element are present

            Story.addThought(thoughtTemplate, function(err, moment) {
                console.log("MOMENT: ");
                console.log(moment);
                Story.getOrCreatePerspective(moment.frame, req.user, function (err, perspective) {
                    console.log('Created Perspective: ');
                    console.log(perspective);

                    //
                    // Update Activity
                    //
                    perspective.activity = moment.frame.last;

                    //
                    // Save updated Activity
                    //
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

                            io.sockets.emit('thought', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
                            res.json(moment);
                        });

                        
                    });
                });
            });
        });
    }
];

exports.update = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var thoughtTemplate = req.body;
            thoughtTemplate.account = account;
            console.log("Received: ");
            console.log(thoughtTemplate);
            console.log("Timeline = %s", thoughtTemplate.timeline);

            // TODO: Verify valid JSON
            // TODO: Verify required fields for element are present

            Perspective.findOne({ frame: thoughtTemplate.frame, account: account }, function(err, perspective) {
                if (thoughtTemplate.hasOwnProperty('active')) {
                    perspective.active = thoughtTemplate.active;
                }

                if (thoughtTemplate.hasOwnProperty('visible')) {
                    perspective.visible = thoughtTemplate.visible;
                }

                if (thoughtTemplate.hasOwnProperty('activity')) {
                    perspective.activity = thoughtTemplate.activity;
                }

                perspective.save(function(err) {
                    if(err) throw err;

                    io.sockets.emit('thought', perspective); // TODO: is this the wrong place?  better place?  guaranteed here?
                    //res.json(moment);
                    res.json(perspective);
                });
            });
        });
    }
];

exports.read = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            conditions = {};
            if (req.query.hasOwnProperty('frame')) {
                conditions['frame'] = req.query['frame'];
            }

            // TODO: Verify valid JSON
            // TODO: Verify required fields for element are present

            Thought.find(conditions, function(err, thoughts) {

                //io.sockets.emit('thought', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
                //res.json(moment);
                res.json(thoughts);

            });
        });
    }
]