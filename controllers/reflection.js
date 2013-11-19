// Controller
// Exports methods for Account model.
var passport = require('passport')
  , socketio = require('socket.io')
  , Account = require('../models/account')
  , Reflection = require('../models/reflection')
  , Moment = require('../models/moment')
  , Inquiry = require('../models/inquiry');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
  passport.authenticate('bearer', { session: false }),
  function(req, res, next) {

    // Get POST data
    var data  = req.body;

    Account.findById(req.user.id, function(err, account) {

      var reflectionTemplate = {
        account: account,
        text: data['text']
      };

      console.log("reflectionTemplate.text = " + reflectionTemplate.text);
      console.log(reflectionTemplate);

      Inquiry.addReflection(reflectionTemplate, function(err, entry) {
        io.sockets.emit('reflection', entry); // TODO: is this the wrong place?  better place?  guaranteed here?
        res.json(entry);
      });

    });

  }
];

// exports.read = [
//   function(req, res, next) {
//     var id = req.params.id;
//     console.log("requesting image id = " + id);
//     if (id) {
//       Frame.findById(id, function(err, frame) {
//         res.json(frame);
//         // res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
//       });
//     }
//   }
// ];