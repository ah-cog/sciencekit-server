// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Bump = require('../models/bump')
    , Moment = require('../models/moment')
	, Inquiry = require('../models/inquiry')
    , Timeline = require('../models/timeline');

exports.read = [
    function(req, res, next) {

        // Get requested activity type from URI
        // e.g., /api/<activityType>/tag
        //var activityType = req.params.activityType;

        // Get Frame ID
        var entryId = req.query.entryId;
        //var frameType = activityType.charAt(0).toUpperCase() + activityType.slice(1) + 'Frame';
        console.log('Getting Bumps for Entry ' + entryId);

        if (entryId) {

            Bump.find({ entry: entryId }).sort('tag').exec(function(err, bumps) {
                if (err) throw err;

                console.log('Got Bump count: ' + bumps.length);

                var bumpCount = bumps.length;
                if (bumpCount > 0) {

                    res.json(bumps);

                } else {
                    var result = [];
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
            console.log("Received Bump template: ");
            console.log(template);

            //
            // Check if Bump with specified label exists for the Material
            //

            Bump.findOne({ account: account, entry: template.entry, text: template.text }, function (err, existingBump) {
                if (err) throw err;

                console.log('Bump:');
                console.log(existingBump);

                //
                // Check if tag exists.  If not, create it.
                //

                if (existingBump === null) {

                    //
                    // Tag doesn't exist.  Create it.
                    //

                    Bump.create({
                        account: account,
                        entry: template.entry,
                        tag: template.tag,
                        degree: template.degree

                    }, function(err, bump) {

                        if (err) throw err;

                        io.sockets.emit('bump', bump);
                        res.json(bump);
                    });
                } else {


                    //
                    // Bump exists.  Find Timeline.
                    //

                    // TODO: Verify integrity of the Bump, associated Moment, associated Timeline.

                    console.log('Bump already exists!');

                    // getTagTimeline(template.text, function(err, timeline) {
                    io.sockets.emit('bump', existingBump);
                    res.json(existingBump);
                    // });
                }
            });
        });
    }
];