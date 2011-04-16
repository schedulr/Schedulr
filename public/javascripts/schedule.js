/**
 * This class represents a single schedule of courses.
 * The courses are stored in two places.
 * First, there is an array of courses as an instance variable.
 * Second, there is an array of slots.  A slot consists of one or more courses and the combination of all of the times for those courses.
 * There are three restrictions on the list of times:
 *   Each time is only on one day.
 *   The times completely cover the times the courses are offerred.
 *   None of the times overlapped (two times will be merged if they do).
 */
var Schedule = (function($) {
  var options = $.extend(true, {}, $.config.schedule);

  return Class.create({
    initialize: wrap(function(manager, container, data) {
      $.Views.getAll(this, options.templates);
      
      this.manager = manager;
      this.container = container;
      this.getColorFunction = this.manager.getColor.bind(this.manager);
      this.timeSelectManager = new TimeSelectManager(this);
      this.startTime = undefined;
      
      if (data && data.courses) {
        this.id = data.id;
        this.name = data.name;
        this.courses = data.courses.clone();
        this.updateSlots();
      } else {
        this.courses = [];
        this.slots = [];
        this.id = undefined;
        this.name = 'My Schedule';
      }
      
      this.render();
    }),
    
    // TODO: Make this better for BIO
    credits: function() {
      var credits = 0;
      for(var c = 0; c < this.courses.length; c++) {
        var num = parseFloat(this.courses[c].course.credits);
        if(!isNaN(num)) credits += num;
      }
      return credits;
    },
    
    contains: function(section) {
      for(var c = 0; c < this.courses.length; c++)
        if(this.courses[c].id == section.id) return true;
      return false;
    },

    /**
     * Connects the mouseover event for each of the scheduled courses.
     */
    bindEvents: function(table, items) {
      $('.scheduleCourse li > a', table).click((function(aTag) {
        var itemIndex = parseInt(aTag.attr('data-index'), 10);
        var tdTag = aTag.closest('.scheduleCourse');
        var slotIndex = parseInt(tdTag.attr('data-scheduleSlot'), 10);
        items[slotIndex][itemIndex].callback();
      }).wrapEvent(this));
      
      
      $('.timeSelectContainer', table).bind('mousedown mousemove mouseup mouseenter', this.timeSelectManager.selectionEvent.wrap(this.timeSelectManager));
      $('.timeSelectContainer', table).bind('onselectstart', function() { return false; });
      $('body').bind('mouseup mouseleave', this.timeSelectManager.externalMouseReleased.wrap(this.timeSelectManager));
    },
    
    // Returns true if the given section would be a conflict on this schedule
    isConflict: function(section) {
      for(var e = 0; e < section.times.length; e++) {
        if(this.timeConflict(section.times[e].day, section.times[e].start.compareValue, section.times[e].end.compareValue)) {
          return true;
        }
      }
      
      return false;
    },
    
    // Returns true if the given start/end/day value conflicts with the schedule
    timeConflict: function(day, startCompare, endCompare) {  
      for(var c = 0; c < this.slots.length; c++) {
        var times = this.slots[c].slot.dates;
        for(var d = 0; d < times.length; d++) {
          if(day !== times[d].day) continue;
          if(times[d].start.compareValue <= endCompare && times[d].end.compareValue >= startCompare) return true;
          if(times[d].start.compareValue <= startCompare && times[d].end.compareValue >= endCompare) return true;
        }
      }
    },
    
    /**
     *  Returns true if there is any conflict in the schedule, false if there are none.
     */
    hasConflict: function() {
      for (var i = 0; i < this.slots.length; ++i) {
        if (this.slots[i].courses.length > 1) {
          return true;
        }
      }

      return false;
    },
    
    // Popup menu items
    addItems: function(c, slot) {
      var items = [];
      if(slot.courses.length === 1) {
        var course = slot.courses[0];
        
        items.push({text: 'Remove Course', callback: this.remove.wrap(this, course, true)});
        items.push({text: 'Course Information ', callback: this.courseInformation.wrap(this, course)});
      } else {
        items.push({text: 'Resolve Conflict', callback: (function() {
          var dialog = new ConflictDialog(this, slot);
        }).wrap(this)});
        
        for(var d = 0; d < slot.courses.length; d++) {
          items.push({text: slot.courses[d].sectionid+' Information', callback: this.courseInformation.wrap(this, slot.courses[d])});
        }
      }
      
      return items;
    },
    
    courseInformation: function(course) {
      new Dialog(this.details.render.bind(this.details, {item: course}), 'Course Information', 'detailsBox');
    },
    
    // Calculates the absolute position and height of a box on the schedule
    offset: function(startTime, targetDate, courses) {
      var headingOffset = 25;
      var textHeight = 15;
      var fiveMinuteBlockHeight = 5;
      var fiveMinuteBlocksOffset = (targetDate.start.hours - startTime.hours)*12 + (targetDate.start.minutes - startTime.minutes)/5;
      var fiveMinuteBlocksHeight = (targetDate.end.hours - targetDate.start.hours)*12 + (targetDate.end.minutes - targetDate.start.minutes)/5;
      var data = {offset : fiveMinuteBlocksOffset * fiveMinuteBlockHeight + headingOffset, height: fiveMinuteBlocksHeight * fiveMinuteBlockHeight};
      if(courses) data.padding = (data.height - (courses * textHeight)) / 2;
      return data;
    },

    /**
     * Draws the schedule.
     */
    render: function() {
      var otherObjs = [];
      var allTimes = [], items = [];
      var startTime = new SchedulrTime([23, 59]);
      var endTime = new SchedulrTime([0, 0]);
      
      this.addFilteredTimes(otherObjs);
      
      for(var c = 0; c < this.slots.length; c++) {
        var slot = this.slots[c];
        allTimes.push.apply(allTimes, slot.slot.dates);				
        items[c] = this.addItems(c, slot);
      }
      for(var c = 0; c < otherObjs.length; c++) {
        allTimes.push(otherObjs[c].date);
      }

      //determine the minimum and maximum time of any course on the schedule
      for(var c = 0; c < allTimes.length; c++) {
        if(allTimes[c].start.compareTo(startTime) < 0) startTime = allTimes[c].start;
        if(allTimes[c].end.compareTo(endTime) > 0) endTime = allTimes[c].end;
      }

      //shift the start/end times so they encompass the full hour
      startTime = new SchedulrTime([startTime.hours, 0]);
      if(endTime.minutes !== 0) endTime = new SchedulrTime([endTime.hours+1, 0]);
      else endTime = endTime.clone();
      
      this.startTime = startTime.clone();
      
      var height = this.offset(startTime, {start: endTime, end: endTime}).offset;
      if(height < 50) height = 50;
      
      var table = $(this.schedule.render({
        offset: this.offset.bind(this, {hours: startTime.hours, minutes: startTime.minutes}),
        height: height,
        slots: this.slots,
        color: this.getColorFunction,
        startTime: startTime,
        endTime: endTime,
        popup: this.popup,
        items: items,
        name: this.shareName(),
        credits: this.credits(),
        otherObjs: otherObjs
      }));
      
      this.bindEvents(table, items);
      this.container.empty();
      table.appendTo(this.container);
    },
    
    // Visualizes the time filters as grey boxes, but only if they do not conflict with a course
    addFilteredTimes: function(objs) {
      var allTimes = $.drillDownState.times;
      if(allTimes === undefined || allTimes.length === 0) return [];
      
      for(var c = 0; c < allTimes.length; c++) {
        var time = allTimes[c];
        var day = 0, timeDays = time.days;
        while(timeDays > 0) {
          if(timeDays & 1 > 0) {
            if(time.interval === "during") {
              if(!this.timeConflict(day, time.startCompare, time.endCompare)) {
                objs.push({
                  date: new SchedulrDate(day, new SchedulrTime([time.startHour, time.startMinute]), new SchedulrTime([time.endHour, time.endMinute])),
                  label: 'Filtered',
                  'class': 'filteredTime'
                });
              }
            } else if(time.interval === "starting before") {
              if(!this.timeConflict(day, (time.startHour-1)*60-time.startMinute, time.startCompare)) {
                objs.push({
                  date: new SchedulrDate(day, new SchedulrTime([time.startHour-1, time.startMinute]), new SchedulrTime([time.startHour, time.startMinute])),
                  label: 'Filtered Before '+timeString(time.startHour, time.startMinute),
                  'class': 'filteredTime'
                });
              }
            } else if(time.interval === "ending after") {
              if(!this.timeConflict(day, time.startCompare, (time.startCompare+1)*60+time.startMinute)) {
                objs.push({
                  date: new SchedulrDate(day, new SchedulrTime([time.startHour, time.startMinute]), new SchedulrTime([time.startHour+1, time.startMinute])),
                  label: 'Filtered After '+timeString(time.startHour, time.startMinute),
                  'class': 'filteredTime'
                });
              }
            }
          }
          
          timeDays = timeDays >> 1;
          day++;
        }
      }
    },
    
    shareName: function() { return this.name; },

    /**
     * Recomputes all of the slots based on the list of courses.
     * Rather than trying to merge slots when courses are added or removed, because it is way too complicated,
     * the slots are simply recreated entirely.
     */
    updateSlots: function() {
      this.slots = [];
      for(var c = 0; c < this.courses.length; c++) {
        var slot = new SchedulrCourseSlot(this.courses[c]);
        var length = this.slots.length;
        for(var d = 0; d < length; d++) {
          if(this.slots[d].conflicts(slot)) {
            slot.merge(this.slots[d]);
            this.slots.remove(d);
            length--;
            d--;
          }
        }
        this.slots.push(slot);
      }
    },

    /**
     * Callback to add a course to the schedule
     */
    add: function(course, save, dontRender) {
      //check if the course is already scheduled
      for(var c = 0; c < this.courses.length; c++) {
        if(this.courses[c].id === course.id) {
          $.error('Oops, this course has already been scheduled.');
          return;
        }
      }
      this.courses.push(course);
      this.updateSlots();
      this.manager.addCourse(course);
      if(save) this.save();
      if(!dontRender) this.render();
    },

    /**
     * Callback to remove a course from the schedule.
     */
    remove: function(course, save) {
      var end = this.courses.length;
      for(var c = 0; c < end; c++) {
        if(this.courses[c].id === course.id) {
          this.courses.remove(c);
          end--;
          c--;
        }
      }
      
      this.updateSlots();
      this.manager.removeCourse(course);
      if(save) this.save();
      this.render();
    },

    /**
     * Main function to save the schedule.
     * This consists of two parts:
     *   1. If the schedule has never been saved, then it needs an id to identify its record in the database.
     *   To get the id, and ajax request is made to /schedule/new which will return it.
     *   2. Once there is an id, the name of the schedule and the course ids are sent.  The slots are not stored
     *   on the server.  There is no need as they can be recreated quickly in the browser, and if the course time
     *   is changed, the slot would need to be recomputed anyway.
     */
    save: function() {
      this.doSave(this.saveSlots.bind(this));
    },
    
    doSave: function(callback) {
      if(this.id === undefined) {
        $.get(options.urls.create, {}, (function(data) {
          this.id = data;
          callback();
        }).bind(this));
      } else {
        callback();
      }
    },

    /**
     * Saves the schedule name/course ids to the database.
     */
    saveSlots: function() {
      var slotString = $.map(this.slots, function(slot) {
        return slot.courses.pluck('id').join(',');
      }).join(',');
      
      $.ajax({url: options.urls.update, data: {courses: slotString, name: this.name, id: this.id}, success: this.manager.scheduleSaved.wrap(this.manager), error: this.ajaxCallback(this.save.wrap(this))});
    },
    
    share: function(email) {
      this.doSave((function() {
        $.ajax({url: options.urls.share, data: {id: this.id, email: email}, success: this.manager.scheduleSaved.wrap(this.manager), error: this.ajaxCallback(this.share.wrap(this, email))});
      }).bind(this));
    },
    
    unshare: function(email) {
      this.doSave((function() {
        $.ajax({url: options.urls.unshare, data: {id: this.id, email: email}, success: this.manager.scheduleSaved.wrap(this.manager), error: this.ajaxCallback(this.unshare.wrap(this, email))});
      }).bind(this));
    },
    
    unshareWithMe: function() {
      this.doSave((function() {
        $.ajax({url: options.urls.unshareWithMe, data: {id: this.id}, success: this.manager.scheduleSaved.wrap(this.manager), error: this.ajaxCallback(this.unshareWithMe.wrap(this))});
      }).bind(this));
    },

    /**
     * Makes an ajax request to delete the schedule.
     */
    destroy: function() {
      if(this.id !== undefined) {
        $.ajax({url: options.urls.destroy, data: {id: this.id}, success: this.manager.scheduleSaved.wrap(this.manager), error: this.ajaxCallback(this.destroy.wrap(this))});
      }
    },
    
    ajaxCallback: function(callback) {
      return function(data) {
        $.error("The most recent thing you did was not saved correctly.  This means if you come back tommorrow, whatever you just did might not show up :(.<br /><br />If you see this message more than once, refresh the page and try your thing again.<br /><br />If it still happens, shoot me an email and I'll do what I can to fix it.");
      };
    }
  });
})(jQuery);
