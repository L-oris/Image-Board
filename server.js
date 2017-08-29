const express = require('express'),
      app = express(),
      multer = require('multer'),
      uidSafe = require('uid-safe'),
      path = require('path'),
      fs = require('fs'),
      knox = require('knox');
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

//setup 'knox' module to upload files to Amazon S3 Service
let secrets;
if(process.env.NODE_ENV==='production'){
  secrets = process.env;
} else {
  secrets = require('./secrets');
}
const client = knox.createClient({
  key: secrets.AWS_KEY,
  secret: secrets.AWS_SECRET,
  bucket: 'image-board-loris'
});


//serve static files (as well as Backbone app)
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

function uploadToS3(req,res){
  const s3Request = client.put(req.file.filename,{
    'Content-Type': req.file.mimetype,
    'Content-Length': req.file.size,
    'x-amz-acl': 'public-read'
  });
  fs.createReadStream(req.file.path).pipe(s3Request);
  s3Request.on('response', function(s3Response){
    const wasSuccessful = s3Response.statusCode === 200;
    res.json({success: wasSuccessful});
  });
}

app.post('/upload',uploader.single('file'),function(req,res){
  // If nothing went wrong the file is already in the uploads directory (because of 'uploader' middleware)
  if(req.file){
    uploadToS3(req,res);
  } else {
    res.json({success: false});
  }
});

//turn on server
const port = 8080;
app.listen(port, function(){console.log(`Listening on port ${port}`)});
