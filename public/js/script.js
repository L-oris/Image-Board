//set up Handlebars
Handlebars.templates = Handlebars.templates || {};
const templates = document.querySelectorAll('template');
Array.prototype.slice.call(templates).forEach(function(tmpl) {
    Handlebars.templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML.replace(/{{&gt;/g, '{{>'));
});


//create Model to handle data for home page

//create View for home page
const HomeView = Backbone.View.extend({
  initialize: function(){},
  render: function(){
    const html = Handlebars.templates.home();;
    this.$el.html(html);
  }
});
const home = new HomeView({
  el: '#main',
  model: {}
});

//render homepage to body
$('body').append(home.render());
