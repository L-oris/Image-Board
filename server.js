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

//body-parser
app.use(require('body-parser').urlencoded({
    extended: false
}));

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

function uploadToS3(req,res,next){
  const s3Request = client.put(req.file.filename,{
    'Content-Type': req.file.mimetype,
    'Content-Length': req.file.size,
    'x-amz-acl': 'public-read'
  });
  fs.createReadStream(req.file.path).pipe(s3Request);
  s3Request.on('response', function(s3Response){
    if(s3Response.statusCode !== 200){
      res.json({success: false});
    } else {
      next();
    }
  });
}

app.post('/upload',uploader.single('file'),uploadToS3,function(req,res){
  //at this point image is saved into 'uploads' directory and uploaded to AWS S3. Now we store image data into database
  const {username,title,description} = req.body;
  const {filename} = req.file;
  const query = 'INSERT INTO images (image,username,title,description) VALUES ($1,$2,$3,$4)';
  db.query(query,[filename,username,title,description])
  .then(function(){
    res.json({success:true});
  })
  .catch(function(err){
    res.json({success:false});
  });
});

app.get('/image/:id',function(req,res){
  //grab all useful data relative to selected image
  const {id} = req.params;
  const query = 'SELECT image,username,title,description FROM images WHERE id = $1';
  db.query(query,[id])
  .then(function(imageData){
    //add path to AWS
    imageData.rows[0].image = s3Url+imageData.rows[0].image;
    const query = 'SELECT user_comment,comment FROM comments WHERE image_id = $1';
    return db.query(query,[id])
    .then(function(commentsData){
      res.json({
        id:id,
        ...imageData.rows[0],
        comments: commentsData.rows
      })
    })
  })
  .catch(function(err){
    console.log(err);
    res.send('error');
  })
});

app.post('/image/:id',function(req,res){
  console.log('post request arrived to server');
  console.log('req.body',req.body);
  res.send('hello')
});


//turn on server
const port = 8080;
app.listen(port, function(){console.log(`Listening on port ${port}`)});
