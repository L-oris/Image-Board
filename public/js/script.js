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
    const html = Handlebars.templates.home(this.model.toJSON());
    this.$el.html(html);
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
      console.log('button clicked in BAckbone');
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
      model: {},
      el: '#main'
    }).render();
  }
});

//instantiate Router and start watching for url changes
const router = new Router();
Backbone.history.start();
