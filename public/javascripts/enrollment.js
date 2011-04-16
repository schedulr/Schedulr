var Enrollment = (function($) {
  var options = $.extend(true, {}, $.config.enrollment);

  return Class.create({
    initialize: wrap(function(container) {
      $.Views.getAll(this, options.templates);
      
      this.downloadEnrollment();
      setInterval(this.downloadEnrollment.wrap(this), options.refresh*1000);
      
      var shadow = $($.shadowTemplate.render()).appendTo(container);
      shadow.wrap("<div id='enrollmentSidebar'></div>");
      this.sidebar = shadow.find('.dropShadowContent');
    }),
    
    downloadEnrollment: function() {
      // Copy the current enrollment data to a hash so we can figure out which courses have changed
      this.oldEnrollment = {};
      if($.enrollment) {
        var courses = $.scheduleManager.courses;
        for(var c = 0; c < courses.length; c++) {
          this.oldEnrollment[courses[c].id] = $.enrollment[courses[c].id];
        }
      }
      
      $.get(image_path(options.url));
    },
    
    // Callback when enrollment data is updated
    update: wrap(function() {
      this.changed = {};
      
      var courses = $.scheduleManager.courses;
      for(var c = 0; c < courses.length; c++) {
        var course = courses[c];
        var id = course.id;
        if(typeof id !== "number") continue;
        
        // If the data was not there before
        if(!this.oldEnrollment[id]) {
          this.changed[id] = true;
        } else {
          // If the data does not match the previous data
          var old = this.oldEnrollment[id];
          var cur = $.enrollment[id];
          if(cur === undefined || old[0] != cur[0] ) {
            this.changed[id] = true;
          }
        }
      }
      
      this.render();
      this.oldEnrollment = {};
      this.changed = {};
    }),
    
    render: function() {
      var html = this.enrollmentSidebar.render({
        changed: this.changed, 
        courses: $.scheduleManager.courses.sort(function(a, b) { return a.sectionid < b.sectionid ? -1 : 1; })
      });
      this.sidebar.html(html);
      
      // IE throws a fit with the highlight effect
      if(!($.browser.msie && $.browser.version < 9)) {
        $('dd[data-changed=yes]', this.sidebar[0]).
          animate({backgroundColor: options.highlightColor}).
          animate({backgroundColor: '#FFF'}, options.highlightDuration);
      }
    }
  });
})(jQuery);