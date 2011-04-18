var Feedback = (function($) {
  var options = $.extend(true, {}, $.config.feedback);

  $(".feedbackLink").live('click', function() { new Feedback(); });
  $(document).ready(function() {
    function showFeedback() {
      $.tooltips.showPermanentAlert("Would you mind taking two minutes and giving me <a href='javascript:void(0);' class='feedbackLink'>some quick feedback</a> on Schedulr?", "Feedback Appreciated");
    }
    
    if(window.state !== undefined && state.feedback !== true) {
      setTimeout(showFeedback, (state.firstVisit ? 120 : 30) * 1000);
    }
  });
  
  return Class.create(Dialog, {
    initialize: wrap(function() {
      $.Views.getAll(this, options.templates);
      
      this.createAndShow((function() { return this.dialog.render({radios: this.radios}); }).bind(this), 'Feedback.', 'feedbackDialogInnerContainer', undefined, {'Submit': this.submit.wrap(this)}, true);
      
      // use a custom close callback
      this._close = this.close;
      this.close = this.feedbackClose;
      
      this.allowSubmit = false;
    }),
    
    // Only allow the feedback window to be closed once all of the radio button questions have been answered
    feedbackClose: function(label) {
      if(label === undefined || label !== 'Submit' || this.allowSubmit) this._close();
    },
    
    submit: function() {
      var form = this.container.find('form')[0];
      var data = {
        rating: $("input[name=rating]", form).val(),
        //use_register: $("input[name=use_register]", form).val(),
        //register_feedback: $("textarea[name=register_feedback]", form).val(),
        share_friend: $("input[name=share_friend]", form).val(),
        share_advisor: $("input[name=share_advisor]", form).val(),
        share_feedback: $("textarea[name=share_feedback]", form).val(),
        bugs: $("textarea[name=bugs]", form).val(),
        recommend: $("input[name=recommend]", form).val(),
        prefer_schedulr: $("input[name=prefer_schedulr]", form).val(),
        feedback: $("textarea[name=feedback]", form).val()
      };
      
      var checkboxes = $w("rating share_friend share_advisor recommend prefer_schedulr");
      for(var c = 0; c < checkboxes.length; c++) {
        var value = data[checkboxes[c]];
        var checkbox = $("input[name="+checkboxes[c]+"]", form).filter(":checked");
        
        if(checkbox.length === 0) {
          $.error("Please at least click each of the radio button sets before submitting the feedback. Thanks!");
          this.allowSubmit = false;
          return;
        }
        data[checkboxes[c]] = checkbox.val();
      }
      
      this.allowSubmit = true;
      Ajax.request(options.url, data, this.onSuccess.wrap(this));
      $.tooltips.remove('Feedback Appreciated');
    },
    
    onSuccess: function() {
      $.tooltips.showAlert('Your feedback has been received.  Thanks so much.');
    }
  });
})(jQuery);