// Controller
// Exports methods for Account model.
var passport = require('passport')
  , socketio = require('socket.io')
  , Account = require('../models/account')
  , PhotoFrame = require('../models/photo-frame')
  , Photo = require('../models/photo')
  , Moment = require('../models/moment')
  , FrameView = require('../models/frame-view')
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

        Story.getOrCreateFrameView(moment.frame, req.user, function (err, frameView) {
            console.log('Created FrameView: ');
            console.log(frameView);

            //
            // Populate JSON structure to return based on element types
            //

            FrameView.getPopulated2(frameView, function(err, populatedFrameView) {

                frameView.activity = moment.frame.last;
                frameView.save(function(err) {
                    if (err) throw err;

                    if (populatedFrameView !== null) {
                        // Replace the generic Frame (e.g., ThoughtFrame) with FrameView associated with the generic Frame for the current Account
                        moment.frame = populatedFrameView;
                    }

                    io.sockets.emit('photo', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
                    res.json(moment);
                });

                
            });
        });
      });

    });

  }
]