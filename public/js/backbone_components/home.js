//append Backbone components I wanna export to global 'window.imageBoard' object
if(!window.imageBoard){
  window.imageBoard = {};
}


window.imageBoard.HomeModel = Backbone.Model.extend({

  url: function(){
    return `/images/${this.get('page')}`;
  },
  initialize: function(){
    this.fetch();
  }
});



window.imageBoard.HomeView = Backbone.View.extend({

  initialize: function(){
    //re-render the view whenever model changes
    this.model.on('change', ()=>{
      this.render();
    })
  },

  render: function(){
    //remove the grey overlay on the entire body (added from 'UploadView')
    removeOverlay();
    //fill template with data from model, then fill the View with it
    const html = Handlebars.templates.home(this.model.toJSON());
    this.$el.html(html);
  },

  events: {
    'loadImages #more-images': 'getOtherImages'
  },
  getOtherImages: function(){
    clearTimeout('searchTimeout');
    //get new images from database and push to Model
    this.model.set('page',this.model.get('page')+1);
    $.get(`/images/${this.model.get('page')}`,(data)=>{
      this.model.set('images',[...this.model.get('images'),...data.images]);
      //prevent infinite scrolling from requesting new images if no other available
      if(data.images.length<imagesLoaded){
        $('#more-images').remove();
      }
    })
  }
});
