/**
 * This class is used for aggregating multiple schedules together.
 * It shows a small sidebar on the left and a title/dropdown on the top of a schedule.
 * The sidebar indicates the color that each course will use on the schedules.
 * The sidebar also lists various actions the user can perform like copying/deleting schedules.
 *
 * To do this, the manager maintains a list of the unique courses between all schedules.
 * Each of these is allocated a single color, which the schedules use so they can all show the same color for each course.
 */
 
var ScheduleManager = (function($) {
  var options = $.extend(true, {}, $.config.schedule);

  return Class.create({
    initialize: wrap(function(container, data) {
      $.Views.getAll(this, options.templates);
      
      //create the html for the top/sidebar
      var shadow = $($.shadowTemplate.render()).appendTo(container);
      shadow.wrap("<div class='scheduleSidebar'></div>");
      this.schedulesSidebarContainer = shadow.find('.dropShadowContent');
      
      shadow = $($.shadowTemplate.render()).appendTo(container);
      shadow.wrap("<div class='scheduleSidebar'></div>");
      this.sidebarContainer = shadow.find('.dropShadowContent');
      
      shadow = $($.shadowTemplate.render()).appendTo(container);
      shadow.wrap("<div id='scheduleContainer'></div>");
      this.scheduleContainer = shadow.find('.dropShadowContent');
      
      this.colors = {};
      this.schedules = [];
      this.shared = [];
      
      //in the beginning, data can be passed in indicating a previous state to load
      if(data && data.schedules && data.schedules.length > 0) {
        this.courses = data.courses.clone();
        $.each(data.schedules, (function(index, schedule) {
          this.newSchedule(schedule, true);
        }).bind(this));
        this.currentScheduleIndex = 0;
        this.allocateColors();
        this.schedules.invoke('render');
        this.render();
      } else {
        this.courses = [];
        this.currentScheduleIndex = -1;
        this.newSchedule();
      }
      
      this.bindEvents();
      
      this.downloadData();
      setInterval(this.downloadData.wrap(this, undefined), options.interval);
    }),
    
    /**
     * Creates a new schedule, renders it, and switches to it
     */
    newSchedule: function(data, dontRender, shared) {
      var container = $("<div class='schedule'></div>").appendTo(this.scheduleContainer);
      var schedule = new Schedule(this, container, data);
      if(shared) {
        this.shared.push(schedule);
      } else {
        this.schedules.push(schedule);
      }
      this.currentScheduleIndex = this.schedules.length-1;
      if(!dontRender) this.render();
      return schedule;
    },

    /**
     * Removes and deletes the current schedule.
     * This has to delete the schedule on the server via an ajax request.
     * This has to remove each course that is in the schedule from the list of all courses,
     * but only if that course is not part of another course.
     */
    removeSchedule: function() {
      var schedule = this.currentSchedule();
      if(schedule.shared) {
        schedule.unshareWithMe();
        this.shared.remove(this.currentScheduleIndex-this.schedules.length);
        this.currentScheduleIndex = this.schedules.length-1;
      } else {
        this.schedules.remove(this.currentScheduleIndex);
        if(this.schedules.length === 0) {
          this.newSchedule();
        } else {
          this.currentScheduleIndex = this.schedules.length-1;
        }
        
        for(var c = 0; c < schedule.courses.length; c++) {
          this.removeCourse(schedule.courses[c]);
        }
        
        schedule.destroy();
      }
      this.render();
    },
    
    copySchedule: function() {
      var schedule = this.currentSchedule();
      var data = {name: ""+schedule.name, id: undefined, courses: schedule.courses.clone()};
      var newSchedule = this.newSchedule(data);
      newSchedule.render();
      newSchedule.save();
      return newSchedule;
    },

    /**
     * Callback to change the current schedule via the dropdown menu.
     */
    changeSchedule: function(currentScheduleIndex) {
      this.currentScheduleIndex = currentScheduleIndex;
      this.render();
      this.currentSchedule().render();
    },

    /**
     * Callback when a course is added to a schedule.
     * Something needs to be done, only if the course has not been scheduled on any other active schedule.
     */
    addCourse: function(course) {
      if(this.colors[course.id] === undefined) {
        this.courses.push(course);
        this.allocateColors();
      }
      this.render();
    },

    /**
     * Removes a course from the list of all courses between all schedules.
     * First it checks if the course is scheduled on any other schedule.  If it is, nothing must be done.
     */
    removeCourse: function(course, render) {
      for(var d = 0; d < this.schedules.length; d++) {
        for(var e = 0; e < this.schedules[d].courses.length; e++) {
          if(this.schedules[d].courses[e].id === course.id) {
            this.render();
            return;
          }
        }
      }
      
      for(var c = 0; c < this.courses.length; c++) {
        if(this.courses[c].id === course.id) {
          this.courses.remove(c);
          break;
        }
      }
      this.allocateColors();
      this.render();
    },

    /**
     * Designates a unique color for each course so they have the same color between every schedule.
     */
    allocateColors: function() {
      var courses = Array.prototype.slice.apply(this.courses);
      courses.sort(function(a, b) { return a.id - b.id; });
      
      this.colors = {};
      for(var c = 0; c < courses.length; c++) {
        this.colors[courses[c].id] = c;
      }
    },

    /**
     * Function that returns the color of the course.
     * If there are multiple courses, it returns the color of the course with the smallest id.
     */
    getColor: function(courses) {
      return this.colors[courses.pluck('id').sort()[0]];
    },

    /**
     * Callback to show a popup menu listing the crns of every course on the current schedule.
     */
    showCrns: function() {
      $.messageView('CRNs for this schedule are:', this.crns, {courses: this.currentSchedule().courses}, 'crnBox');
    },

    /**
     * Callbackto show a popup to rename the current schedule.
     */
    renameSchedule: function() {
      var schedule = this.currentSchedule();
      if(schedule.shared) {
        $.error("Sorry, you can't rename someone else's schedule.")
        return;
      }
      
      var dialog = new Dialog((function() { return this.renameScheduleTemplate.render({schedule: schedule}); }).bind(this), 'Rename the Current Schedule');
      $('form', dialog.container).submit((function(form, event) {
        event.preventDefault();

        //get the name and save it
        var name = $('input.nameField', form).val();
        schedule.name = name;
        schedule.save();
        
        dialog.close();

        //since the name has changed, we must re-render the header
        this.render();
      }).bindEvent(this));
    },

    /**
     * Updates the sidebar at the right so all of the courses show up.
     * The events need to be rebinded every time because the html is completely overwritten.
     */
    renderSidebar: function() {
      var items = [];	
      var zippedCurrent = [], zippedAll = [];
      
      var schedule = this.currentSchedule();
      if(schedule.shared) {
        var courses = this.currentSchedule().courses;
        for(var c = 0; c < courses.length; c++) {
          (function(c) {
            var course = courses[c];
            items[c] = [];
            
            zippedCurrent.push([course, c]);
            for(var d = 0; d < this.schedules.length; d++) {
              items[c].push({text: 'Add to '+this.schedules[d].name, callback: this.schedules[d].add.wrap(this.schedules[d], course, true)});
            }
            
            items[c].push({text: 'Course Information ', callback: (function() {
              this.currentSchedule().courseInformation(course);
            }).wrap(this)});
            
          }).bind(this)(c);
        }
      } else {
        for(var c = 0; c < this.courses.length; c++) {
          (function(c) {
            var course = this.courses[c];
            items[c] = [];
            
            if(schedule.contains(course)) {
              zippedCurrent.push([course, c]);
              items[c].push({text: 'Remove '+course.sectionid, callback: (function() {
                this.currentSchedule().remove(course, true);
              }).wrap(this)});
            } else {
              zippedAll.push([course, c]);
              items[c].push({text: 'Add '+course.sectionid, callback: (function() {
                this.currentSchedule().add(course, true);
              }).wrap(this)});
            }
            
            items[c].push({text: 'Course Information ', callback: (function() {
              this.currentSchedule().courseInformation(course);
            }).wrap(this)});
            
          }).bind(this)(c);
        }
      }
      
      var sortFunction = function(a, b) {return a[0].sectionid < b[0].sectionid ? -1 : 1 }
      zippedCurrent = zippedCurrent.sort(sortFunction);
      zippedAll = zippedAll.sort(sortFunction);
      
      this.schedulesSidebarContainer.html(this.sidebarSchedules.render({
        schedules: this.schedules,
        shared: this.shared,
        currentScheduleIndex: this.currentScheduleIndex
      }));
      
      this.sidebarContainer.html(this.sidebar.render({
        courses: this.courses,
        colors: this.currentSchedule().getColorFunction,
        popup: this.popup,
        items: items,
        schedules: this.schedules,
        shared: this.shared,
        currentScheduleIndex: this.currentScheduleIndex,
        zippedCurrent: zippedCurrent,
        zippedAll: zippedAll
      }));
      
      $.enrollmentManager && $.enrollmentManager.render();
      this.items = items;
    },

    /**
     * Switches the schedules so the current schedule is visible.
     * Updates the top section so it shows the correct heading.
     */
    render: function() {
      $('div.schedule', this.scheduleContainer).hide();
      this.currentSchedule().container.show();
      this.allocateColors();
      this.renderSidebar();
      this.currentSchedule().render();
    },
    
    /**
     * Helper method to return the current viewable schedule.
     */
    currentSchedule: function() {
      if(this.currentScheduleIndex >= this.schedules.length) {
        return this.shared[this.currentScheduleIndex-this.schedules.length];
      } else {
        return this.schedules[this.currentScheduleIndex];
      }
    },
    
    bindEvents: function() {
      $('.sidebarCourses > li li > a', this.sidebarContainer[0]).live('click', (function(aTag) {
        var itemIndex = parseInt(aTag.attr('data-index'), 10);
        var popupContainer = aTag.closest('.popupContainer');
        var courseIndex = parseInt(popupContainer.attr('data-sidebarCourseId'), 10);
        this.items[courseIndex][itemIndex].callback();
      }).wrapEvent(this));
      
      $('#showCrns', this.sidebarContainer[0]).live('click', this.showCrns.wrap(this));
      $('#blankSchedule', this.sidebarContainer[0]).live('click', this.newSchedule.wrap(this));
      $('#copySchedule', this.sidebarContainer[0]).live('click', this.copySchedule.wrap(this));
      $('#removeSchedule', this.sidebarContainer[0]).live('click', this.removeSchedule.wrap(this));
      $('#renameSchedule', this.sidebarContainer[0]).live('click', this.renameSchedule.wrap(this));
      $('#shareSchedule', this.sidebarContainer[0]).live('click', this.shareSchedule.wrap(this));
      $('#exportSchedule', this.sidebarContainer[0]).live('click', this.exportSchedule.wrap(this));
      $('#registerSchedule', this.sidebarContainer[0]).live('click', this.registerSchedule.wrap(this));
      $("#printSchedule", this.sidebarContainer[0]).live('click', this.printSchedule.wrap(this));
      
      $('.sidebarSchedules > li', this.schedulesSidebarContainer[0]).live('click', (function(liTag) {
        var index = parseInt(liTag.attr('data-sidebarScheduleId'), 10);
        this.changeSchedule(index);
      }).wrapEvent(this));
    },
    
    printSchedule: function() {
      $.messageView('Print', this.print);
    },
    
    shareSchedule: function() {
      var schedule = this.currentSchedule();
      if(schedule.shared) {
        $.error("You cannot share a schedule that is not yours.");
        return;
      }
      this.downloadData((function() {
        var dialog = new ShareDialog(schedule);
      }).bind(this));
    },
    
    exportSchedule: function() {
      if (this.gcalManager === undefined) {
        this.gcalManager = new GcalManager(this);
      }
      
      if (!this.gcalManager.isAuthenticated()) {
        this.gcalManager.makeDialog(this.gcalManager.redirectNotificationDialog, "Redirection Notification", 
          {
            "Continue": this.gcalManager.authenticate,
            "Cancel": undefined
          });
      } else {
        this.doExport();
      }
    },
    
    registerSchedule: function() {
      new RegisterDialog(this.currentSchedule());
    },
    
    doExport: function() {
      var schedule = this.currentSchedule();
      
      if (schedule.hasConflict()) {
        $.error("Your schedule contains conflicts: please resolve all conflicts before exporting!");
        return;
      }
      
      this.gcalManager.exportSchedule();
    },
    
    /**
     * This beast of a function downloads the state of all the shared schedules for a user every two minutes.
     * I have received a number of bug reports for this function, so I have added a large number of extra checks
     * in order to be much more defensive.
     */
    downloadData: function(callback) {
      Ajax.silent(options.urls.data, (function(data) {
        /**
         * Replace the list of email addresses that a schedule is shared with, with the updated list just downloaded.
         */
        for(var c = 0; c < this.schedules.length; c++) {
          this.schedules[c].emails = [];
        }
        
        if(state.myShared !== undefined && this.schedules !== undefined) {
          for(var c = 0; c < state.myShared.length; c++) {
            for(var d = 0; d < this.schedules.length; d++) {
              if(state.myShared[c].id === this.schedules[d].id) {
                this.schedules[d].emails = state.myShared[c].emails;
                break;
              }
            }
          }
        }
        
        // Sync the shared schedules and course lists with the received data
        // Attempts to only re-render the schedule if the course lists do not match
        var newShared = [];
        for(var c = 0; c < state.sharedWithMe.length; c++) {
          var found = false;
          var sharedSchedule = state.sharedWithMe[c];
          if(sharedSchedule === undefined) continue;
          
          for(var d = 0; d < this.shared.length; d++) {
            var schedule = this.shared[d];
            
            if(schedule === undefined || schedule.id !== sharedSchedule.id) continue;
            found = true;
            
            var schedule = this.shared[d];
            schedule.name = sharedSchedule.name;
              
            var sameCourses = schedule.courses.length === sharedSchedule.courses.length;
            for(var e = 0; e < schedule.courses.length && sameCourses; e++) {
              var currentCourse = schedule.courses[e];
              var sharedCourse = sharedSchedule.courses[e];
              sameCourses = currentCourse !== undefined && sharedCourse !== undefined && currentCourse.id === sharedCourse.id;
            }
            
            if(!sameCourses) {
              schedule.courses = state.sharedWithMe[c].courses;
              schedule.updateSlots();
              schedule.render();
            }
              
            newShared.push(schedule);
            break;
          }
          
          if(!found) {
            var container = $("<div class='schedule'></div>").appendTo(this.scheduleContainer);
            newShared.push(new SharedSchedule(this, container, state.sharedWithMe[c]));
          }
        }
        
        // Update the current schedule if the shared schedule that is being viewed was deleted
        if(this.currentScheduleIndex >= this.schedules.length) {
          var current = this.currentSchedule();
          var found = false;
          for(var c = 0; c < newShared.length; c++) {
            if(newShared[c].id === current.id) {
              this.currentScheduleIndex = c + this.schedules.length;
              found = true;
              break;
            }
          }
          if(!found) {
            this.currentScheduleIndex = 0;
          }
        }
        this.shared = newShared;
        
        if(callback) callback();
        
        this.render();
      }).wrap(this));
    }
  });
})(jQuery);