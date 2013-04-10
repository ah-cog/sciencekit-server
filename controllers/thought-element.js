// Controller
// Exports methods for Account model.
var passport = require('passport')
    , socketio = require('socket.io')
	, Account = require('../models/account')
	, Thought = require('../models/thought')
	, ThoughtElement = require('../models/thought-element')
    , Story = require('../models/story');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.list = [
    passport.authenticate('bearer', { session: false }),
        function(req, res) {
        // req.authInfo is set using the `info` argument supplied by
        // `BearerStrategy`.  It is typically used to indicate scope of the token,
        // and used in access control checks.  For illustrative purposes, this
        // example simply returns the scope in the response.
        //Thought.findById(req.user.id, function(err, account) {
        //Thought.find({}, function(err, thoughts) {
        ThoughtElement.find({}).populate('author').exec(function(err, thoughtElements) {
            res.json(thoughtElements);
            // res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
        });
    }
]

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            // function sendResponse(req, res, socketEvent, object) {
            //   // Return result to clients
            //   io.sockets.emit(socketEvent, object); // TODO: is this the wrong place?  better place?  guaranteed here?
            //   res.json(object);
            // }

            var thoughtElementTemplate = req.body;
            thoughtElementTemplate.account = account;
            console.log("Received: ");
            console.log(thoughtElementTemplate);
            console.log("Timeline = %s", thoughtElementTemplate.timeline);

            // TODO: Verify valid JSON
            // TODO: Verify required fields for element are present

            Story.addThought(thoughtElementTemplate, function(err, timelineElement) {
                res.json(timelineElement);
                io.sockets.emit('thought', timelineElement); // TODO: is this the wrong place?  better place?  guaranteed here?
            });
        });
    }
]