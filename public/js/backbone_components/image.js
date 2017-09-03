//append Backbone components I wanna export to global 'window.imageBoard' object
if(!window.imageBoard){
  window.imageBoard = {};
}


window.imageBoard.ImageModel = Backbone.Model.extend({

  url: function(){
    return `/image/${this.get('id')}/${this.get('page')}`
  },
  initialize: function(){
    this.fetch();
  },

  save: function(){
    $.ajax({
      url: `/image/${this.get('id')}`,
      method: 'POST',
      data: this.get('newComment'),
      success: (data)=>{
        //append new comment to already existing comments --> set model again, causing 'ImageView' to refresh
        this.set('comments',[
          {
            //new comment
            user_comment: this.get('newComment').user_comment,
            comment: this.get('newComment').comment,
            created_at: data.created_at
          },
          ...this.get('comments')
        ]);
      }
    });
  }
});



window.imageBoard.ImageView = Backbone.View.extend({

  initialize: function(){
    //re-render 'ImageView' when anything on ImageModel changes
    this.model.on('change',()=>{
      this.render();
    });
  },

  render: function(){
    //remove the grey overlay on the entire body (added from 'UploadView')
    removeOverlay();
    const html = Handlebars.templates.image(this.model.toJSON());
    this.$el.html(html);
    //inform user if already liked current image
    if(localStorage.getItem(`thumb-up-${this.model.get('id')}`)){
      $('.image-likes').css('color','red')
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
      //reset error-loading messages
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
      //prevent infinite scrolling from requesting new comments if no other available
      if(data.comments.length<commentsLoaded){
        $('#more-comments').remove();
      }
    })
  },

  likeImage: function(){
    const url = `/image/${this.model.get('id')}/thumbup`;
    //prevent user from liking image multiple times
    if(!(localStorage.getItem(`thumb-up-${this.model.get('id')}`))){
      $.post(url,(data)=>{
        localStorage.setItem(`thumb-up-${this.model.get('id')}`,true);
        this.model.set('likes',data.likes);
      });
    }
  }

});
