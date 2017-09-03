const express = require('express'),
      app = express();


//setup middlewares
const {middlewares} = require('./express/middleware');
middlewares(app);

//setup router
app.use(require('./express/router'));

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
app.listen(port, ()=>console.log(`Listening on port ${port}`));
