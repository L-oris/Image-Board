const multer = require('multer'),
      uidSafe = require('uid-safe'),
      path = require('path');


//set up middleware for image uploading
const diskStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname + '/../uploads'));
  },
  filename: function (req, file, callback) {
    uidSafe(24).then(function(uid) {
      callback(null, uid + path.extname(file.originalname));
    });
  }
})

module.exports.uploader = multer({
  storage: diskStorage,
  limits: {
    filesize: 2097152
  }
});
