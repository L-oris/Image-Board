const express = require('express');
const app = express();
//get url for static images
const {s3Url} = require('./config.json');

//connect to local database
const {username,password} = require('./secrets.json');
var spicedPg = require('spiced-pg');
var db = spicedPg(`postgres:${username}:${password}@localhost:5432/imageBoard`);

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

app.post('/upload',function(req,res){
  console.log('upload request received!');
  res.send('upload request received!')
});

//turn on server
const port = 8080;
app.listen(port, function(){console.log(`Listening on port ${port}`)});
