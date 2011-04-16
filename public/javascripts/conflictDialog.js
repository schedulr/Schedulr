/**
 * This Class is responsible for showing a dialog when two or more courses have overlapping times.
 * It will show the user which courses are overlapping, and the other times both courses are offered.
 */

var ConflictDialog = (function($) {
  var options = $.extend(true, {}, $.config.schedule);

  return Class.create(Dialog, {
    initialize: wrap(function(schedule, slot) {
      $.Views.getAll(this, options.templates);
      
      this.slot = slot;
      this.schedule = schedule;
      
      this.createAndShow((function() { return this.conflictDialog.render({slot: slot, schedule: schedule}); }).bind(this), 'Oops!  There is a scheduling conflict.', 'conflictDialogInnerContainer');
      
      this.bindEvents();
      this.previousPanel = undefined;
    }),

    /**
     * When the box is created, all of the html for every submenu is created as well, it is just initially hidden.
     * There are two main sets of events that need to be created then.
     * First, there are events in the middle column which essentially just cause the html of the third column to change.
     * Second, there are events in the third column which cause an action to take place in the schedule and close the dialog.
     */
    bindEvents: function() {
      $('ul.conflictedActions li.ignoreConflictAction', this.container).click(this.close.wrap(this));
      
      $('ul.conflictedActions li', this.container).mouseenter(wrapEvent(this, function(elem) {
        var clas = elem.attr('class');
        
        if(clas === 'ignoreConflictAction') return this.hidePanel();
        
        this.showPanel(parseInt(clas.split("-")[1]));
      }));
      
      
      $('ul.conflictedSubActions li', this.container).click(wrapEvent(this, function(elem) {
        var clas = elem.attr('class').replace("conflict", "");
        var bits = clas.split("-");
        
        if(bits.length > 1) {
          var id = parseInt(bits[1], 10);
          if(id !== undefined) {
            var course = this.slot.courses[id];
            if(course !== undefined) {
              this.schedule.remove(course, true);
              if(bits[0] === 'moveCourse' && bits.length >= 3) {
                var newCourse = course.course.sections[parseInt(bits[2], 10)];
                this.schedule.add(newCourse, true);
              }
            }
          }
        }
        this.close();
      }));
    },

    /**
     * Removes any panel from the third column.
     */
    hidePanel: function() {
      if(this.previousPanel) this.previousPanel.hide();
    },

    /**
     * Sets the html of the third column to be the panel indicated by index.
     */
    showPanel: function(index) {
      var clas = ".conflictPanel-"+index;
      this.hidePanel();
      this.previousPanel = $(clas, this.container).show();
    }
  });
})(jQuery);