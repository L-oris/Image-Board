//append Backbone components I wanna export to global 'window.imageBoard' object
if(!window.imageBoard){
  window.imageBoard = {};
}


window.imageBoard.UploadModel = Backbone.Model.extend({

  //make jQuery ajax request to server for uploading new image
  url: '/upload',
  save: function(){
    //use the browser's built-in FormData
    const formData = new FormData();
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



window.imageBoard.UploadView = Backbone.View.extend({

  initialize: function(){
    this.render();
    //if user clicks somewhere on the overlay, remove 'UploadView' and return back
    $('.overlay').click(function(){
      $('#upload').empty();
      removeOverlay();
      $(this).off('click');
      window.history.back();
    });
  },

  render: function(){
    const html = Handlebars.templates.upload({});
    this.$el.html(html);
    //add grey overlay on the entire body and prevent scrolling
    addOverlay();
  },

  events: {
    'click #upload-image': 'uploadImage'
  },

  uploadImage: function(){
    //set data from <input>s into model, then 'save()' --> that is making ajax 'POST' request to server
    const title = this.$el.find('input[name="title"]').val();
    const description = this.$el.find('textarea[name="description"]').val();
    const username = this.$el.find('input[name="username"]').val();
    const file = this.$el.find('input[type="file"]').prop('files')[0];
    if(!(title&&description&&username&&file)){
      $('.upload-container .text-error').show();
    } else {
      this.model.set({title,description,username,file}).save();
      //reset error-loading messages
      $('.upload-container #upload-image, .upload-fields .text-error').hide();
      $('.upload-container .loader').show();
    }
  }
});
