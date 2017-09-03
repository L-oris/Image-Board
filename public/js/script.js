//setup variables (must be equal on server-side)
//set number of images you wanna first load on 'HomeView' and number of comments you wanna first load on 'ImageView'
const imagesLoaded = 6;
const commentsLoaded = 3;

function addOverlay(){
  $('.overlay').show();
  $('body').addClass('prevent-scrolling');
}
function removeOverlay(){
  $('.overlay').hide();
  $('body').removeClass('prevent-scrolling');
}

//implement infinite scrolling
(function myTimer(){
  searchTimeout = setTimeout(function(){
    if($(document).scrollTop() + $(window).height() > $(document).height()-50){
      // if we're on bottom, and there are more results to be displayed, get them
      $('#more-images').trigger('loadImages');
      $('#more-comments').trigger('loadComments');
    }
    // loop over the timer again
    myTimer();
  },1000)
}());


//set up Handlebars
Handlebars.templates = Handlebars.templates || {};
const templates = document.querySelectorAll('template');
Array.prototype.slice.call(templates).forEach(function(tmpl) {
    Handlebars.templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML.replace(/{{&gt;/g, '{{>'));
});

//remove previous event handlers on current view before mounting a new one
const oldSetElement = Backbone.View.prototype.setElement;
Backbone.View.prototype.setElement = function(el){
  $(el).off();
  oldSetElement.call(this,el);
};








//create Router
const Router = Backbone.Router.extend({
  routes: {
    '': 'home',
    'upload': 'upload',
    'image/:id':'image'
  },

  home: function(){
    $('#upload').empty();
    new window.imageBoard.HomeView({
      model: new window.imageBoard.HomeModel({page:0}),
      el: '#main'
    }).render();
  },
  upload: function(){
    new window.imageBoard.UploadView({
      model: new window.imageBoard.UploadModel(),
      el: '#upload'
    }).render();
  },
  image: function(id){
    new window.imageBoard.ImageView({
      model: new window.imageBoard.ImageModel({id:id,page:0}),
      el: '#main'
    }).render()
  }
});

//instantiate Router and start watching for url changes
const router = new Router();
Backbone.history.start();
