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
})

//body-parser
app.use(require('body-parser').urlencoded({
    extended: false
}))

//serve static files (as well as Backbone app)
app.use(express.static(__dirname + '/public'));

app.get('/images/:pageNumber',function(req, res){
  //set required number of images retrieved from server
  const imagesRetrieved = 6;
  const {pageNumber} = req.params;
  //get data from server
  db.query('SELECT * FROM images LIMIT $1 OFFSET $2',[imagesRetrieved,imagesRetrieved*(pageNumber-1)])
  .then(function(data){
    dbimages = data.rows.map(function(item){
      item.image = s3Url+item.image;
      return item;
    });
    res.json({'images':dbimages})
  })
  .catch(function(err){
    throw `Error getting images from database`;
  });
})

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
  if(!(username,title,description,filename)){
    throw 'Incorrect fields provided';
  };
  const query = 'INSERT INTO images (image,username,title,description) VALUES ($1,$2,$3,$4)';
  db.query(query,[filename,username,title,description])
  .then(function(){
    res.json({success:true});
  })
  .catch(function(err){
    throw `Error adding new image into database`;
  });
})

app.get('/image/:id',function(req,res){
  //grab all useful data relative to selected image
  const {id} = req.params;
  const query = 'SELECT image,username,title,description FROM images WHERE id = $1';
  db.query(query,[id])
  .then(function(imageData){
    //add path to AWS
    imageData.rows[0].image = s3Url+imageData.rows[0].image;
    const query = 'SELECT user_comment,comment,created_at FROM comments WHERE image_id = $1 ORDER BY created_at DESC';
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
    throw `Error getting image into database`;
  })
})

app.post('/image/:id',function(req,res){
  //store new comment to database
  const {image_id,user_comment,comment} = req.body;
  if(!(image_id,user_comment,comment)){
    throw 'Incorrect fields provided for posting new comment';
  };
  const query = 'INSERT INTO comments (image_id,user_comment,comment) VALUES ($1,$2,$3) RETURNING created_at';
  db.query(query,[image_id,user_comment,comment])
  .then(function(data){
    res.json({created_at:data.rows[0].created_at.toLocaleString()});
  })
  .catch(function(err){
    throw `Error adding new comment into database`;
  });
})

//catch all missing routes
app.all('*',function(req,res){
  res.status(404).json({success: false})
})

//handle errors
app.use(function (err, req, res, next) {
  console.error(err);
  res.json({success:false})
})

//turn on server
const port = 8080;
app.listen(port, function(){console.log(`Listening on port ${port}`)});
