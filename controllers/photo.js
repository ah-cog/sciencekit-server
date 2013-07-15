// Controller
// Exports methods for Account model.
var passport = require('passport')
  , socketio = require('socket.io')
  , Account = require('../models/account')
  , Photo = require('../models/photo')
  , Moment = require('../models/moment')
  , Inquiry = require('../models/inquiry');

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
      // photoTemplate.timeline = timeline;
      photoTemplate.account  = account;
      // if (data.hasOwnProperty('activity'))  photoTemplate.activity   = data.activity;
      // if (data.hasOwnProperty('reference')) photoTemplate.reference  = data.reference;
      // var filenameStart = req.files.myphoto.path.indexOf("/photos");
      // var photoUri = req.files.myphoto.path.substring(filenameStart);
      console.log("photoUri = " + photoTemplate.uri);
      console.log(photoTemplate);

      Inquiry.addPhoto(photoTemplate, function(err, entry) {
        io.sockets.emit('photo', entry); // TODO: is this the wrong place?  better place?  guaranteed here?
        res.json(entry);
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