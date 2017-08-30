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
  url: '/images'
});

//create View for home page
const HomeView = Backbone.View.extend({
  initialize: function(){
    var view = this;
    //re-render the view whenever model changes
    this.model.on('change', function(){
      view.render();
    })
  },
  render: function(){
    //fill template with data from model, then fill the View with it
    const html = Handlebars.templates.home(this.model.toJSON());
    this.$el.html(html);
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
    const model = this;
    $.ajax({
      url: this.url,
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(){
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
    this.$el.html(html);
  },
  events: {
    'click button': 'uploadImage'
  },
  uploadImage: function(e){
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
    //when requesting data from server, pass down the image 'id' in order to query database
    return `/image/${this.get('id')}`;
  },
  initialize: function(){
    this.fetch();
  },
  save: function(){
    const formData = {
      image_id: this.get('image_id'),
      user_comment: this.get('user_comment'),
      comment: this.get('comment')
    };
    //make ajax request to server with that data
    const model = this;
    $.ajax({
      url: this.url(),
      method: 'POST',
      data: formData,
      success: function(){
        model.fetch();
      }
    });
  }
});
const ImageView = Backbone.View.extend({
  initialize: function(){
    const view = this;
    //re-render 'ImageView' when anything on ImageModel changes
    this.model.on('change',function(){
      view.render();
    });
  },
  render: function(){
    const html = Handlebars.templates.image(this.model.toJSON());
    this.$el.html(html);
  },
  events: {
    'click #upload-comment': 'uploadComment'
  },
  uploadComment: function(){
    //set data from <input>s into model, then 'save()' --> that is making ajax 'POST' request to server
    const image_id = this.model.get('id');
    const user_comment = this.$el.find('input[name="user_comment"]').val();
    const comment = this.$el.find('textarea[name="comment"]').val();
    if(!(image_id&&user_comment&&comment)){
      $('.image-container .text-error').show();
    } else {
      this.model.set({image_id,user_comment,comment}).save();
      $('#upload-comment, .image-container .text-error').hide();
      $('.image-container .loader').show();
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
      model: new HomeModel(),
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
      model: new ImageModel({id:id}),
      el: '#main'
    }).render()
  }
});

//instantiate Router and start watching for url changes
const router = new Router();
Backbone.history.start();
