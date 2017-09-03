//set required number of images and comments retrieved from database per time (for pagination purposes)
//PS. Those variables must be equal client-side
const imagesLoaded = 6;
//set required number of comments retrieved from database per time
const commentsLoaded = 5;

const express = require('express'),
      router = express.Router();

//connect to local database
const {username,password} = require('../secrets.json');
var spicedPg = require('spiced-pg');
var db = spicedPg(`postgres:${username}:${password}@localhost:5432/imageBoard`);

//inside database only last part of image's url is stored; first part instead is stored inside 'config.json' --> then will be easier to switch away from AWS S3 if needed
const {s3Url} = require('../config.json');



//GET IMAGES FROM DATABASE
router.get('/images/:pageNumber',function(req, res){
  const {pageNumber} = req.params;
  const query = 'SELECT * FROM images ORDER BY created_at DESC LIMIT $1 OFFSET $2';
  db.query(query,[imagesLoaded,imagesLoaded*pageNumber])
  .then(function(data){
    dbimages = data.rows.map(function(item){
      //append first part of url to each object retrieved
      item.image = s3Url+item.image;
      return item;
    });
    res.json({'images':dbimages})
  })
  .catch(function(err){
    throw `Error getting images from database`;
  });
})


//middlewares to work with AWS S3
const {uploader, uploadToS3} = require('./middleware');
//UPLOAD A NEW IMAGE ON BOTH AWS-S3 AND DATABASE
router.post('/upload',uploader.single('file'),uploadToS3,function(req,res){
  //at this point image is saved into 'uploads' directory and uploaded to AWS S3. Now we store image data into database
  const {username,title,description} = req.body;
  const {filename} = req.file;
  if(!(username,title,description,filename)){
    throw 'Incorrect fields provided';
  };
  const query = 'INSERT INTO images (image,username,title,description,likes) VALUES ($1,$2,$3,$4,0)';
  db.query(query,[filename,username,title,description])
  .then(function(){
    res.json({success:true});
  })
  .catch(function(err){
    throw `Error adding new image into database`;
  });
})


//GET SINGLE IMAGE ('pageNumber' param is relative to comments for that image)
router.get('/image/:id/:pageNumber',function(req,res){
  const {id,pageNumber} = req.params;
  const query = 'SELECT image,username,title,description,likes FROM images WHERE id = $1';
  db.query(query,[id])
  .then(function(imageData){
    //add path to AWS
    imageData.rows[0].image = s3Url+imageData.rows[0].image;
    const query = 'SELECT user_comment,comment,created_at FROM comments WHERE image_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    return db.query(query,[id,commentsLoaded,commentsLoaded*pageNumber])
    .then(function(data){
      const commentsData = data.rows.map(function(comment){
        //format Date of each comment before returning them to client
        comment.created_at = comment.created_at.toLocaleString();
        return comment;
      });
      res.json({
        id:id,
        ...imageData.rows[0],
        comments: commentsData
      })
    })
  })
  .catch(function(err){
    throw `Error getting image into database`;
  })
})


//SAVE NEW COMMENT
router.post('/image/:id', function(req,res){
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
});


//SAVE USER'S 'LIKE' FOR SPECIFIC IMAGE
router.post('/image/:id/:thumbup',function(req,res){
  const {id} = req.params;
  const query = 'UPDATE images SET likes = likes+1 WHERE id=$1 returning likes';
  db.query(query,[id])
  .then(function(data){
    res.json({likes:data.rows[0].likes})
  })
  .catch(function(e){
    throw `Error adding 'Like' into database`;
  })
})



module.exports = router;
