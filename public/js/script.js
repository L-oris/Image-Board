//set up Handlebars
Handlebars.templates = Handlebars.templates || {};
const templates = document.querySelectorAll('template');
Array.prototype.slice.call(templates).forEach(function(tmpl) {
    Handlebars.templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML.replace(/{{&gt;/g, '{{>'));
});



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
    formData.append('name',this.get('name'));
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
        model.trigger('fileUploaded');
      }
    });
  }
});

//create View for upload page --> allow to upload new images using <input type="file"/>
const UploadView = Backbone.View.extend({
  initialize: function(){
    this.render();
  },
  render: function(){
    const html = Handlebars.templates.upload({});
    this.$el.html(html);
  },
  events: {
    'click button': function(e){
      //set data from <input>s into model, then 'save()' --> that is making ajax 'POST' request to server
      this.model.set({
        title: this.$el.find('input[name="title"]').val(),
        description: this.$el.find('textarea[name="description"]').val(),
        name: this.$el.find('input[name="name"]').val(),
        file: this.$el.find('input[type="file"]').prop('files')[0],
      });
      this.model.save();
    }
  }
});



//create Router
const Router = Backbone.Router.extend({
  routes: {
    '': 'home',
    'upload': 'upload',
  },
  home: function(){
    new HomeView({
      model: new HomeModel(),
      el: '#main'
    }).render();
  },
  upload: function(){
    new UploadView({
      model: new UploadModel(),
      el: '#main'
    }).render();
  }
});

//instantiate Router and start watching for url changes
const router = new Router();
Backbone.history.start();
