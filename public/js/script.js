//set up Handlebars
Handlebars.templates = Handlebars.templates || {};
const templates = document.querySelectorAll('template');
Array.prototype.slice.call(templates).forEach(function(tmpl) {
    Handlebars.templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML.replace(/{{&gt;/g, '{{>'));
});


//create Model to handle data for home page
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
    this.model.on('change', function(){
      view.render();
    })
  },
  render: function(){
    const html = Handlebars.templates.home(this.model.toJSON());
    this.$el.html(html);
  }
});

// console.log('homeModel is now',homeModel);
const homeView = new HomeView({
  model: new HomeModel(),
  el: '#main'
});

//render homepage to body
$('body').append(homeView.render());
