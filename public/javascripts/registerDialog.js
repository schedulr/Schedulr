var RegisterDialog = (function($) {
  var options = $.extend(true, {}, $.config.schedule);

  return Class.create(Dialog, {
    initialize: wrap(function(schedule) {
      $.Views.getAll(this, options.templates);
      
      this.schedule = schedule;
      
      this.createAndShow((function() { return this.registerDialog.render({courses: this.schedule.courses}); }).bind(this), 'Register Your Courses.', 'registerDialog', undefined, undefined, true);
      
      this.bindEvents();
      this.updateCourses();
    }),
    
    bindEvents: function() {
      $('.stepOneButton', this.container[0]).click(this.showStep.wrap(this, '.stepTwo', '.stepOne'));
      $('.stepTwoButton', this.container[0]).click(this.showStep.wrap(this, '.stepThree', '.stepTwo'));
      $("input[type=checkbox]", this.container[0]).click(this.updateCourses.wrap(this)).change(this.updateCourses.wrap(this));
    },
    
    showStep: function(newClass, oldClass) {
      var div = $(newClass, this.container[0]);
      var oldDiv = $(oldClass, this.container[0]);
      
      if(div.is(':visible')) return;
      
      div.fadeIn();
      oldDiv.stop().animate({opacity: 0.5});
    },
    
    updateCourses: function() {
      var boxes = $("input[type=checkbox]:checked", this.container[0]);
      var courses = [];
      for(var c = 0; c < boxes.length; c++) {
        courses.push(this.schedule.courses[parseInt($(boxes[c]).val(), 10)]);
      }
      var crns = courses.pluck('crn');
      var ids = courses.pluck('sectionid');
      
      $(".registerText", this.container[0]).html("The link below will register you for: "+ids.join(', ')+".");
      
      crns = $.map(crns, function(crn) { return "CRN_IN="+crn; }).join('&');
      var url = "https://novasis.villanova.edu/pls/bannerprd/bwckcoms.P_Regs?CRED=DUMMY&CRN_IN=DUMMY&" + crns + "&CRSE=DUMMY&GMOD=DUMMY&LEVL=DUMMY&MESG=DUMMY&REG_BTN=DUMMY&REG_BTN=Submit%20Changes&RSTS_IN=DUMMY&RSTS_IN=RW&RSTS_IN=RW&RSTS_IN=RW&RSTS_IN=RW&RSTS_IN=RW&RSTS_IN=RW&RSTS_IN=RW&RSTS_IN=RW&RSTS_IN=RW&RSTS_IN=RW&SEC=DUMMY&SUBJ=DUMMY&TITLE=DUMMY&add_row=10&assoc_term_in=DUMMY&assoc_term_in=&assoc_term_in=&assoc_term_in=&assoc_term_in=&assoc_term_in=&assoc_term_in=&assoc_term_in=&assoc_term_in=&assoc_term_in=&assoc_term_in=&end_date_in=DUMMY&end_date_in=&end_date_in=&end_date_in=&end_date_in=&end_date_in=&end_date_in=&end_date_in=&end_date_in=&end_date_in=&end_date_in=&regs_row=0&start_date_in=DUMMY&start_date_in=&start_date_in=&start_date_in=&start_date_in=&start_date_in=&start_date_in=&start_date_in=&start_date_in=&start_date_in=&start_date_in=&term_in=" + schedulrData.terms.current.code + "&wait_row=0";
      
      $(".registerLink", this.container[0]).attr('href', url);
    }
  });
})(jQuery);