// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Note = require('../models/note')
	, Inquiry = require('../models/inquiry');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var noteTemplate = req.body;
            noteTemplate.account = account;
            // console.log("Received: ");
            // console.log(collaborationTemplate);
            // console.log("Timeline = %s", collaborationTemplate.timeline);

            Note.create({
                account: noteTemplate.account,
                entry: noteTemplate.entry,
                note: noteTemplate.note

            }, function(err, note) {

                if (err) throw err;

                io.sockets.emit('note', note);
                res.json(note);

            });


            // Inquiry.addNote(collaborationTemplate, function(err, entry) {
            //     io.sockets.emit('note', entry);
            //     res.json(entry);
            // });
            
        });
    }
];

exports.read = [
    function(req, res, next) {

        // Get requested activity type from URI
        // e.g., /api/<activityType>/tag
        //var activityType = req.params.activityType;

        // Get Frame ID
        var entryId = null;
        if (req.query['entryId']) {
            entryId = req.query['entryId'];
        }
        //var frameType = activityType.charAt(0).toUpperCase() + activityType.slice(1) + 'Frame';
        console.log('Getting Notes for Entry ' + entryId);

        var result = [];

        if (entryId !== null) {

            Note.find({ entry: entryId }).sort('-date').exec(function(err, notes) {
                if (err) throw err;

                console.log('Got note count: ' + notes.length);

                var noteCount = notes.length;
                if (noteCount > 0) {

                    res.json(notes);

                } else {
                    res.json(result);
                }
                
            });
        } else {
            res.json(result);
        }
    }
];