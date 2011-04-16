/**
 * This class represents a single shared schedule of courses.
 */
var SharedSchedule = (function($) {
  var options = $.extend(true, {}, $.config.schedule);

  return Class.create(Schedule, {
    initialize: wrap(function(manager, container, data) {
      $.Views.getAll(this, options.templates);
      
      this.manager = manager;
      this.container = container;
      this.shared = true;
      this.getColorFunction = this.getColor.bind(this);
      
      this.id = data.id;
      this.name = data.name;
      this.sharer = data.sharer;
      this.courses = data.courses.clone();
      this.updateSlots();
      
      this.render();
    }),
    
    // Popup menu items
    addItems: function(c, slot) {
      var items = [];
      if(slot.courses.length === 1) {
        var course = slot.courses[0];
        for(var d = 0; d < this.manager.schedules.length; d++) {
          items.push({text: 'Add to '+this.manager.schedules[d].name, callback: this.manager.schedules[d].add.wrap(this.manager.schedules[d], course)});
        }
        items.push({text: 'Course Information ', callback: this.courseInformation.wrap(this, course)});
      } else {
        for(var d = 0; d < slot.courses.length; d++) {
          items.push({text: slot.courses[d].sectionid+' Information', callback: this.courseInformation.wrap(this, slot.courses[d])});
        }
      }
      
      return items;
    },
    
    // Attempts to return colors in a deterministic way
    getColor: function(courses) {
      var id = courses.pluck('id').sort()[0];
      var ids = this.courses.pluck('id').sort();
      for(var c = 0; c < ids.length; c++) {
        if(id === ids[c]) return c;
      }
    },
    
    shareName: function() {
      return this.name +" from "+this.sharer;
    },

    add: function() { $.error("You cannot add courses to a shared schedule."); },
    remove: function(course, save) {$.error("You cannot remove courses from a shared schedule."); },
    save: function() {$.error("You cannot save a shared schedule."); },
    saveSlots: function() {$.error("You cannot save a shared schedule."); },
    destroy: function() {$.error("You cannot delete a shared schedule."); }
  });
})(jQuery);


var ShareDialog = (function($) {
  var options = $.extend(true, {}, $.config.schedule);

  return Class.create(Dialog, {
    initialize: wrap(function(schedule) {
      $.Views.getAll(this, options.templates);
      this.schedule = schedule;
      this.emails = [];
      
      for(var c = 0; c < state.myShared.length; c++) {
        if(state.myShared[c].id === this.schedule.id) {
          this.emails = state.myShared[c].emails;
        }
      }
      
      this.createAndShow((function() { return this.shareDialog.render({schedule: schedule, emails: this.emails}); }).bind(this), 'Share This Schedule', 'shareBox');
      this.bindEvents();
    }),

    bindEvents: function() {
      $("#shareButton", this.container[0]).live("click", this.share.wrap(this));
      $(".removeLink", this.container[0]).live("click", this.unshare.wrapEvent(this));
    },
    
    share: function() {
      var email = $("#shareEmail", this.container[0]).val();
      if(email.length === 0) {
        $.error("You must enter an email to share your schedule.");
        return;
      }
      if(email.match(/[^@]+@[^@]+\.[^@]+/) === null) {
        return $.error("You must enter a valid email address.");
      }
      this.emails.push(email);
      this.schedule.share(email);
      this.render();
    },
    
    unshare: function(aTag) {
      var trTag = aTag.closest("tr");
      var tdTag = $(trTag.children()[0]);
      var email = tdTag.html();
      this.emails.remove(this.emails.indexOf(email));
      this.schedule.unshare(email);
      this.render();
    }
  });
})(jQuery);