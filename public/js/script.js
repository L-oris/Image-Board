//setup variables (must be equal on server-side)
//set number of images you wanna first load on 'HomeView' and number of comments you wanna first load on 'ImageView'
const imagesLoaded = 6;
const commentsLoaded = 3;


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



//Handle data for home page
const HomeModel = Backbone.Model.extend({
  initialize: function(){
    this.fetch();
  },
  url: function(){
    return `/images/${this.get('page')}`;
  }
});

//create View for home page
const HomeView = Backbone.View.extend({
  initialize: function(){
    //re-render the view whenever model changes
    this.model.on('change', ()=>{
      this.render();
    })
  },
  render: function(){
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
      //hide the 'more-images' button if no other images to display
    })
  }
});



const UploadModel = Backbone.Model.extend({
  url: '/upload',
  save: function(){
    //use the browser's built in FormData
    const formData = new FormData();
    //append there data that model owns
    formData.append('title',this.get('title'));
    formData.append('description',this.get('description'));
    formData.append('username',this.get('username'));
    formData.append('file',this.get('file'));
    //make ajax request to server with that data
    $.ajax({
      url: this.url,
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: ()=>{
        //render Home again with new data
        router.navigate('',true);
      }
    });
  }
});

//create View for upload page --> allow to upload new images using <input type="file"/>
const UploadView = Backbone.View.extend({
  initialize: function(){
    this.render();
    //when new file has uploaded, re-render HomeView with new data --> listen for events on model
    this.model.on('fileUploaded',function(){
      router.navigate('',true);
    });
  },
  render: function(){
    const html = Handlebars.templates.upload({});
    this.$el.html(html).find('.upload-container').effect('slide').effect('shake');
  },
  events: {
    'click button': 'uploadImage'
  },

  uploadImage: function(){
    //set data from <input>s into model, then 'save()' --> that is making ajax 'POST' request to server
    const title = this.$el.find('input[name="title"]').val();
    const description = this.$el.find('textarea[name="description"]').val();
    const username = this.$el.find('input[name="username"]').val();
    const file = this.$el.find('input[type="file"]').prop('files')[0];
    if(!(title&&description&&username&&file)){
      $('.upload-fields .text-error').show();
    } else {
      this.model.set({title,description,username,file}).save();
      $('.upload-fields button, .upload-fields .text-error').hide();
      $('.upload-fields .loader').show();
    }
  }
});



const ImageModel = Backbone.Model.extend({
  url: function(){
    return `/image/${this.get('id')}/${this.get('page')}`
  },
  initialize: function(){
    this.fetch();
  },

  save: function(){
    const model = this;
    $.ajax({
      url: `/image/${this.get('id')}`,
      method: 'POST',
      data: this.get('newComment'),
      success: function(data){
        //append new comment to already existing comments --> set model again, causing 'ImageView' to refresh
        model.set('comments',[{
          user_comment: model.get('newComment').user_comment,
          comment: model.get('newComment').comment,
          created_at: data.created_at
        },...model.get('comments')]);
      }
    });
  }
});

const ImageView = Backbone.View.extend({
  initialize: function(){
    //re-render 'ImageView' when anything on ImageModel changes
    this.model.on('change',()=>{
      this.render();
    });
  },
  render: function(){
    const html = Handlebars.templates.image(this.model.toJSON());
    this.$el.html(html);
    if(localStorage.getItem(`thumb-up-${this.model.get('id')}`)){
      $('#thumb-up').css('color','red')
    };
  },
  events: {
    'click #upload-comment': 'uploadComment',
    'loadComments #more-comments': 'getOtherComments',
    'click #thumb-up': 'likeImage'
  },

  uploadComment: function(){
    //set data from <input>s into model, then 'save()' --> that is making ajax 'POST' request to server
    const image_id = this.model.get('id');
    const user_comment = this.$el.find('input[name="user_comment"]').val();
    const comment = this.$el.find('textarea[name="comment"]').val();

    if(!(image_id&&user_comment&&comment)){
      $('.image-container .text-error').show();
    } else {
      this.model.set('newComment',{image_id,user_comment,comment}).save();
      $('#upload-comment, .image-container .text-error').hide();
      $('.image-container .loader').show();
    }
  },

  getOtherComments: function(){
    clearTimeout('searchTimeout');
    //get new images from database and push to Model
    this.model.set('page',this.model.get('page')+1);
    $.get(`/image/${this.model.get('id')}/${this.model.get('page')}`,(data)=>{
      this.model.set('comments',[...this.model.get('comments'),...data.comments]);
    })
  },

  likeImage: function(){
    const url = `/image/${this.model.get('id')}/thumbup`;
    //if user doesn't already thumb-up image, let him do it
    if(!(localStorage.getItem(`thumb-up-${this.model.get('id')}`))){
      $.post(url,(data)=>{
        localStorage.setItem(`thumb-up-${this.model.get('id')}`,true);
        this.model.set('likes',data.likes);
      });
    }
  }

});



//create Router
const Router = Backbone.Router.extend({
  routes: {
    '': 'home',
    'upload': 'upload',
    'image/:id':'image'
  },

  home: function(){
    $('#upload').empty();
    new HomeView({
      model: new HomeModel({page:0}),
      el: '#main'
    }).render();
  },
  upload: function(){
    new UploadView({
      model: new UploadModel(),
      el: '#upload'
    }).render();
  },
  image: function(id){
    new ImageView({
      model: new ImageModel({id:id,page:0}),
      el: '#main'
    }).render()
  }
});

//instantiate Router and start watching for url changes
const router = new Router();
Backbone.history.start();
