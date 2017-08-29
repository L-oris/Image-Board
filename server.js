const express = require('express'),
      app = express(),
      multer = require('multer'),
      uidSafe = require('uid-safe'),
      path = require('path')
//get url for static images
const {s3Url} = require('./config.json');

//connect to local database
const {username,password} = require('./secrets.json');
var spicedPg = require('spiced-pg');
var db = spicedPg(`postgres:${username}:${password}@localhost:5432/imageBoard`);

//set up middleware for image uploading
const diskStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, __dirname + '/uploads');
  },
  filename: function (req, file, callback) {
    uidSafe(24).then(function(uid) {
      callback(null, uid + path.extname(file.originalname));
    });
  }
});
const uploader = multer({
  storage: diskStorage,
  limits: {
    filesize: 2097152
  }
});

app.use(express.static(__dirname + '/public'));

app.get('/images',function(req, res){
  //get data from server
  db.query('SELECT * FROM images')
  .then(function(data){
    dbimages = data.rows.map(function(item){
      item.image = s3Url+item.image;
      return item;
    });
    res.json({'images':dbimages})
  })
  .catch(function(err){
    console.log(err);
    res.send('Error!');
  });
});

app.post('/upload',uploader.single('file'),function(req,res){
  // If nothing went wrong the file is already in the uploads directory (because of 'uploader' middleware)
  if(req.file){
    res.json({
      success: true
    });
  } else {
    res.json({
      success: false
    });
  }
});

//turn on server
const port = 8080;
app.listen(port, function(){console.log(`Listening on port ${port}`)});
