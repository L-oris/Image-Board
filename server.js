//set required number of images and comments retrieved from database per time
//PS. Those variables must be equal client-side (for pagination)
const imagesLoaded = 6;
//set required number of comments retrieved from database per time
const commentsLoaded = 10;

const express = require('express'),
      app = express();

//connect to local database
const {username,password} = require('./secrets.json');
var spicedPg = require('spiced-pg');
var db = spicedPg(`postgres:${username}:${password}@localhost:5432/imageBoard`);

//add middlewares
const {middlewares} = require('./express/middleware');
middlewares(app);


//get url for static images
const {s3Url} = require('./config.json');

//get middlewares to work with AWS S3
const {uploader, uploadToS3} = require('./express/middleware');


app.get('/images/:pageNumber',function(req, res){
  const {pageNumber} = req.params;
  //get data from server
  db.query('SELECT * FROM images ORDER BY created_at DESC LIMIT $1 OFFSET $2',[imagesLoaded,imagesLoaded*pageNumber])
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

app.post('/upload',uploader.single('file'),uploadToS3,function(req,res){
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


//grab all useful data relative to selected image
app.get('/image/:id/:pageNumber',function(req,res){
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

function likeImage(req,res){
  const {id} = req.params;
  const query = 'UPDATE images SET likes = likes+1 WHERE id=$1 returning likes';
  db.query(query,[id])
  .then(function(data){
    res.json({likes:data.rows[0].likes})
  })
  .catch(function(e){
    throw `Error adding 'Like' into database`;
  })
}

app.post('/image/:id/:thumbup?',function(req,res){
  if(req.params.thumbup){
    return likeImage(req,res);
  }
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
