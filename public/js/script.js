//set number of images you wanna first load on 'HomeView' and number of comments you wanna first load on 'ImageView'.
//PS. Those variables must be equal server-side (for pagination)
const imagesLoaded = 6;
const commentsLoaded = 3;

//set up Handlebars
Handlebars.templates = Handlebars.templates || {};
const templates = document.querySelectorAll('template');
Array.prototype.slice.call(templates).forEach(function(tmpl) {
  Handlebars.templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML.replace(/{{&gt;/g, '{{>'));
});

//override built-in Backbone behaviour for Views --> remove previous event handlers on current View before mounting a new one
const oldSetElement = Backbone.View.prototype.setElement;
Backbone.View.prototype.setElement = function(el){
  $(el).off();
  oldSetElement.call(this,el);
};


//implement infinite scrolling
(function myTimer(){
  searchTimeout = setTimeout(function(){
    if($(document).scrollTop() + $(window).height() > $(document).height()-50){
      //when reaching bottom page, ask models for new data
      $('#more-images').trigger('loadImages');
      $('#more-comments').trigger('loadComments');
    }
    // loop over the timer again
    myTimer();
  },1000)
}());

//overall general-purpose functions
function addOverlay(){
  $('.overlay').show();
  $('body').addClass('prevent-scrolling');
}
function removeOverlay(){
  $('.overlay').hide();
  $('body').removeClass('prevent-scrolling');
}



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

//start listening for url changes
const router = new Router();
Backbone.history.start();
