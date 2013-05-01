// Controller
// Exports methods for Account model.
var passport = require('passport')
  , socketio = require('socket.io')
  , Account = require('../models/account')
  , Photo = require('../models/photo')
  , Moment = require('../models/moment')
  , Frame = require('../models/frame')
  , Perspective = require('../models/perspective')
  , Story = require('../models/story');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
  passport.authenticate('bearer', { session: false }),
  function(req, res, next) {

    //var timeline = '5156b399cefe76e37d000001';


    // Get POST data
    var data     = req.body;
    var timeline = data.timeline;
    console.log("PhotoFrame Timeline: %s", timeline);

    // Get files
    //console.log(req.files);

    Account.findById(req.user.id, function(err, account) {

      var photoTemplate      = {};
      var filenameStart      = req.files.myphoto.path.indexOf("/uploads");
      photoTemplate.file     = req.files.myphoto;
      photoTemplate.uri      = req.files.myphoto.path.substring(filenameStart);
      photoTemplate.timeline = timeline;
      photoTemplate.account  = account;
      if (data.hasOwnProperty('activity'))  photoTemplate.activity   = data.activity;
      if (data.hasOwnProperty('reference')) photoTemplate.reference  = data.reference;
      // var filenameStart = req.files.myphoto.path.indexOf("/photos");
      // var photoUri = req.files.myphoto.path.substring(filenameStart);
      console.log("photoUri = " + photoTemplate.uri);
      console.log(photoTemplate);

      Story.addPhoto(photoTemplate, function(err, moment) {
        // io.sockets.emit('photo', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
        // res.json(moment);

        Story.getOrCreatePerspective(moment.frame, req.user, function (err, perspective) {
            console.log('Created Perspective: ');
            console.log(perspective);

            perspective.activity = moment.frame.last;
            perspective.save(function(err) {
                //
                // Populate JSON structure to return based on element types
                //

                Perspective.getPopulated2(perspective, function(err, populatedPerspective) {
                    if (err) throw err;

                    if (populatedPerspective !== null) {
                        // Replace the generic Frame (e.g., Thought) with FramePerspective associated with the generic Frame for the current Account
                        moment.frame = populatedPerspective;
                    }

                    io.sockets.emit('photo', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
                    res.json(moment);
                });

                
            });
        });
      });

    });

  }
];

exports.read = [
  function(req, res, next) {
    var id = req.params.id;
    console.log("requesting image id = " + id);
    if (id) {
      Frame.findById(id, function(err, frame) {
        res.json(frame);
        // res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
      });
    }
  }
];