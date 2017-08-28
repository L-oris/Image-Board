const express = require('express');
const app = express();
//get url for static images
const urlAddress = require('./config.json');

//connect to local database
var spicedPg = require('spiced-pg');
var db = spicedPg('postgres:Loris:765joker8a@localhost:5432/imageBoard');

app.use(express.static(__dirname + '/public'));

app.get('/images',function(req, res){
  //get data from server
  db.query('SELECT * FROM images')
  .then(function(data){
    return data.rows
  })
  .then(function(dbimages){
    res.json({'images':dbimages})
  })
  .catch(function(err){
    console.log(err);
    res.send('Error!');
  });
});

//turn on server
const port = 8080;
app.listen(port, function(){console.log(`Listening on port ${port}`)});
