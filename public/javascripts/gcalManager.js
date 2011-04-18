
var GcalManager = (function($) {
  var options = $.extend(true, {}, $.config.gcal);

  return Class.create({
    initialize: function(manager) {
      $.Views.getAll(this, options.templates);
      
      // ScheduleManager instance
      this.manager = manager;
      
      // CalendarService used for creating/accessing calendars
      this.service = new google.gdata.calendar.CalendarService("Schedulr");
      
      // The id of the calendar
      this.gcalId = undefined;
      
      // Maps a string title of a course to a boolean representing if that course is on the schedule
      this.timeToCourseTitleHash = {};
      
      this.conflictedEvents = [];
      
      // GcalProgressDialog to show progress in export.
      this.progressDialog = undefined;
    },
    
    makeDialog: function(view, title, callbacks, data) {
      return new Dialog(function() { return view.render(data); }, title, 'gcalDialogInnerContainer', undefined, callbacks, true);
    },
    
    /**
     * If the user deletes a course from their Schedulr schedule, and they do not replace its block of time
     * on the schedule with something else, it needs to be removed from the Google Calendar.
     * This essentially will remove all events on the Google Calendar that do not have a corresponding 
     * course time on the Schedulr schedule.
     **/
    removeLeftoverEvents: function() {
      var events = [];
      var query = new google.gdata.calendar.CalendarEventQuery(options.urls.idPrefixUrl + this.gcalId + options.urls.idSuffixUrl);
      var processedCount = 0;
      var leftoverCount = 0;
      var hasLeftoverEvents = false;
      
      // Don't expand recurrences, just get the set of events on the calendar
      query.setRecurrenceExpansionStart(null);
      query.setRecurrenceExpansionEnd(null);
      query.setSingleEvents(false);
      
      this.service.getEventsFeed(query,
        (function(root) {
          var entries = root.feed.getEntries();
          
          for (var i = 0; i < entries.length; ++i) {
            var currentEvent = entries[i];
            
            if (this.schedulrDidCreate(currentEvent)) {
              // First, we want to get the value of our hash at the start time for this event.  By default
              // it seems they didn't have anything in their getTimes() array, so we passed an extended property
              // with the recurrence formatted time.  If a course exists at this time, it will give the title of
              // this course.
              var courseTitle = this.timeToCourseTitleHash[currentEvent.getExtendedProperties()[0].getValue()];
              
              var schedulrCourseRemoved = (courseTitle !== currentEvent.getTitle().$t);
              
              if (schedulrCourseRemoved) {
                hasLeftoverEvents = true;
                leftoverCount++;
                
                currentEvent.deleteEntry((function() {
                  // If we have processed all remaining stragglers, we are done!
                  // Yippee!
                  processedCount++;
                  if (processedCount == leftoverCount) {
                    setTimeout(this.exportCompleted.bind(this), 1000);
                  }
                }).bind(this));
              }
            }
          }
          
          // In the case that we don't have any events that needed removing,
          // we are done!
          if (!hasLeftoverEvents) {
            this.exportCompleted();
          }
        }).bind(this),
        (function(error) {
          this.exportFailed(error)
        }).bind(this)
      );
    },
    
    /**
     * This method is responsible for populating an event queue that contains gcal time objects (see comment for
     * insertEvent on the structure of this object).  It will essentially: 
     *    - Iterate through each of Schedulr's course times and check to see if they are conflicting 
     *      with anything in the Google Calendar.  
     *    - If there is no conflict it adds it to the update queue, 
     *    - If it is but the names are the same, it does nothing, as they are the same course/event, and 
     *    - If the names are different, it will delete the conflicted entry on the Google Calendar to make way 
     *      for the new event.
     */
    beginExport: function() {
      this.progressDialog.updateStatus("Processing schedule course times...");
      
      var numEvents = this.getCourseTimeCount();
      var processedEvents = 0;
      var schedule = this.manager.currentSchedule();
      var eventsToUpdate = [];
      
      this.conflictedEvents = [];
      this.timeToCourseTitleHash = {};
      
      // No classes are on our calendar, so just pass updateEvents the empty array
      // and leave.
      if (numEvents == 0) {
        this.updateEvents(eventsToUpdate);
        return;
      }
      
      for (var i = 0; i < schedule.courses.length; ++i) {
        var currentCourse = schedule.courses[i];
        
        for (var j = 0; j < currentCourse.times.length; ++j) {
          var courseTime = currentCourse.times[j];
          var start = courseTime.start;
          var end = courseTime.end;
          var day = options.daystring[courseTime.day];
          
          var gcalTimes = this.gcalTimesFromCourseTime(courseTime, schedulrData.terms.current.start);
          var termEnd = this.gcalTimesFromCourseTime(courseTime, schedulrData.terms.current.end);
          
          var query = new google.gdata.calendar.CalendarEventQuery(options.urls.idPrefixUrl + this.gcalId + options.urls.idSuffixUrl);
          
          // Two ISO time strings representing the start/end time of the course.
          var startIso = this.isoTimeFromGcalTime(gcalTimes.start, gcalTimes.startTime);
          var endIso = this.isoTimeFromGcalTime(gcalTimes.end, gcalTimes.endTime);
          
          var startMin = google.gdata.DateTime.fromIso8601(startIso);
          var startMax = google.gdata.DateTime.fromIso8601(endIso);
          query.setMinimumStartTime(startMin);
          query.setMaximumStartTime(startMax);
          
          // For now, let's just assume that this course will be on the calendar.
          // If there turns out there is a conflict, it will be updated.
          this.timeToCourseTitleHash[gcalTimes.start + gcalTimes.startTime] = currentCourse.course.title;
          
          // We will essentially get a list of all events on the Google Calendar
          // that occur between startMin and startMax, i.e., we find all conflicts on the 
          // calendar for this current course time.
          (function (start, end, startTime, endTime, day, title, location, termEnd) {
            this.service.getEventsFeed(query,
              (function(root) {
                var event = root.feed.getEntries()[0];

                // If the length of the entries feed is 0, we have no events that take place during the time
                // duration of our current course time, so we can safely add this course time to the queue of
                // events that will be added to the Google Calendar.
                if (root.feed.getEntries().length == 0) {
                  eventsToUpdate.push({
                    title: title,
                    start: start,
                    startTime: startTime,
                    end: end,
                    endTime: endTime,
                    day: day,
                    termEnd: termEnd,
                    location: location
                  });
                } else if (event.getTitle().$t != title) { // TODO: Maybe a better way to compare a Schedulr course time and a Google Calendar event?
                  // The current course time on Schedulr and the event in the same range on
                  // the Google Calendar are not the same, meaning we have a conflict.
                  
                  if (this.schedulrDidCreate(event)) {
                    event.deleteEntry((function(result) {
                        eventsToUpdate.push({
                          title: title,
                          start: start,
                          startTime: startTime,
                          end: end,
                          endTime: endTime,
                          day: day,
                          termEnd: termEnd,
                          location: location
                        });
                      }).bind(this),
                      function(error) {
                        $.log(error);
                      });
                  } else {
                    this.conflictedEvents.push({
                      gcal: event,
                      schedulr: {
                          title: title,
                          start: start,
                          startTime: startTime,
                          end: end,
                          endTime: endTime,
                          day: day
                      }
                    });
                  }
                }
                
                // If the names are equal for the event at the queried time,
                // then nothing was changed, but we still need to note that
                // we saw this event in our hash.
                processedEvents++;
                
                // Have we processed all of the course times in our schedule?
                if (processedEvents == numEvents) {
                  this.updateEvents(eventsToUpdate);
                }
              }).bind(this),
              (function(error) {
                this.exportFailed(error);
              }).bind(this));
          }).bind(this)(gcalTimes.start, gcalTimes.end, gcalTimes.startTime, gcalTimes.endTime, day, currentCourse.course.title, courseTime.location, termEnd);  
        }
      }
    },
    
    /**
     * Begins the synchronization process between Schedulr and Google Calendar.
     */
    updateEvents: function(events) {
      this.progressDialog.updateStatus("Synchronizing Google Calendar with Schedulr...");

      for (var i = 0; i < events.length; ++i) {
        this.insertEvent(events[i]);
      }
      this.removeLeftoverEvents();
    },
    
    /**
     * Inserts an event (or Schedulr event representation) into the Google Calendar.
     *
     * The format of an event representation object is:
     * {
          title: title,
          start: start,
          startTime: startTime,
          end: end,
          endTime: endTime,
          day: day
       }
     **/
    insertEvent: function(schedulrEventRepresentation) {
      var termEnd = schedulrEventRepresentation.termEnd.start + schedulrEventRepresentation.termEnd.startTime + "Z";
      var recurrenceString = this.createRecurrence({
        dtstart: schedulrEventRepresentation.start + schedulrEventRepresentation.startTime,
        dtend: schedulrEventRepresentation.end + schedulrEventRepresentation.endTime,
        location: schedulrEventRepresentation.location,
        rrule: {
          propList: true,
          freq: "WEEKLY",
          byday: schedulrEventRepresentation.day,
          until: termEnd
        }
      });
      
      var entry = new google.gdata.calendar.CalendarEventEntry();
      entry.setTitle(google.gdata.Text.create(schedulrEventRepresentation.title));
      
      var recurrence = new google.gdata.Recurrence();
      recurrence.setValue(recurrenceString);
      entry.setRecurrence(recurrence);
      
      // Used later for linear time determination of whether or not a calendar event is still a
      // Schedulr event.
      //this.timeToCourseTitleHash[schedulrEventRepresentation.title] = true;
      
      // Give the event a special mark to signify we created it.  This will be used in for two purposes: 
      // One, when deleting events, as we may not want to delete events that the user has created himself,
      // and two, when comparing event equality.
      extendedProp = new google.gdata.ExtendedProperty();
      extendedProp.setName('start-time-key');
      extendedProp.setValue(schedulrEventRepresentation.start + schedulrEventRepresentation.startTime);
      entry.addExtendedProperty(extendedProp);
  
      // Submit the request using the calendar service object
      this.service.insertEntry(options.urls.idPrefixUrl + this.gcalId + options.urls.idSuffixUrl, 
        entry, 
        function() {
          $.log("Added course " + schedulrEventRepresentation.title);
        }, 
        function(error) {
          $.log("Error adding course " + event.title + ":" + error);
        }, 
        google.gdata.calendar.CalendarEventEntry);
    },
    
    /**
     * Returns true if Schedulr created the event.
     * 
     * @param gcalEvent - A CalendarEventEntry object on which to test.
     */
    schedulrDidCreate: function(gcalEvent) {
      return (gcalEvent.getExtendedProperties()[0] !== undefined 
              && gcalEvent.getExtendedProperties()[0].getName() === "start-time-key");
    },
    
    /**
     * Returns a ISO string format of the supplied gcalDate and gcalTime
     *
     * @param gcalDate - String representation of the date formatted as such: "yyyymmdd"
     * @param gcalTime - String representation of the time formatted as such: "Thhmmss"
     */
    isoTimeFromGcalTime: function(gcalDate, gcalTime) {
      var ret = [];
      var date = [gcalDate.substr(0, 4), gcalDate.substr(4, 2), gcalDate.substr(6, 2)];
      ret.push(date.join("-"));
      
      // Grab the hours, minues, and seconds from the time property.  We include the leading "T" prefix for calendar
      // recurrences as well, as ISO uses them too.  (e.g, T123000 == 12:30pm)
      var time = [gcalTime.substr(0, 3), gcalTime.substr(3, 2), gcalTime.substr(5, 2)];
      ret.push(time.join(":"));
      ret.push(".000-04:00"); // No seconds and Eastern Time Zone (-4:00 is right. not -5:00, as it wants it in terms of GMT)
      
      return ret.join("");
    },
    
    /**
     * Returns an object in the form of:
     * {
        start: String representation of the date formatted as such: "yyyymmdd" 
        startTime: String representation of the time formatted as such: "Thhmmss"
        end: String representation of the date formatted as such: "yyyymmdd"
        endTime: String representation of the time formatted as such: "Thhmmss"
     * }
     * where each value is formatted to be compatible with Google Calendar recurrences.
     * 
     * @param courseTime - The Schedulr CourseTime object to be parsed.
     */
    gcalTimesFromCourseTime: function(courseTime, termDate) {
      var times = ["start", "end"];
      var retTime = {};
      
      for (var i = 0; i < times.length; ++i) {
        var key = times[i];
        var date = termDate;
        
        // Sets the actual day for the gcalTime to be the next courseTime.day in the coming week.
        // (i.e, if you are reading this on a Monday, and the course is scheduled for a Wednesday,
        // it will set the starting date for that wednesday.)  This is so we can add events 
        // more easily, just adding them to Google Calendar at the next time they start.
        date.setHours(date.getHours() + (((courseTime.day + 1) - date.getDay()) * 24));
        
        retTime[key] = date.toJSON().replace(/[-]+/gi, "").replace(/T.*/gi, "");
        retTime[key + "Time"] = "T" +
                        courseTime[key].hours.toPaddedString(2) +
                        courseTime[key].minutes.toPaddedString(2) +
                        "00";
      }
      return retTime;
    },
    
    /**
     * Returns the duration (in hours and minutes) of the two CourseTime objects.
     * This will format the result to work with Google Calendar Recurrences.
     * 
     * @param start - The starting CourseTime
     * @param end - The ending CourseTime
     */
    getDuration: function(start, end) {
      if (end.minutes < start.minutes) {
        end.hours -= 1;
        end.minutes += 60;
      }
      return "PT" + (end.hours - start.hours) + "H" + (end.minutes - start.minutes) + "M";
    },
    
    /**
     * Returns the total number of course times there are on the schedule.
     */
    getCourseTimeCount: function() {
      var ret = 0;
      var schedule = this.manager.currentSchedule();
      
      for (var i = 0; i < schedule.courses.length; ++i) {
        for (var j = 0; j < schedule.courses[i].times.length; ++j) {
          ret++;
        }
      }
      
      return ret;
    },
    
    /**
     * This function will take an object representation of an iCal recurrence string and convert it
     * to the correctly formatted recurrence string.  For a list of properties, you can visit
     * http://www.ietf.org/rfc/rfc2445.txt for the complete specification.
     *
     * NOTE: PROPERTY NAMES ARE CASE SENSITIVE!!!!
     */
    createRecurrence: function(properties) {
      var recurrence = [];
      
      for (var key in properties) {
        
        // Start the array of with the key name in upper-case
        var line = [key.toUpperCase()];
        var currentPropertyVal = properties[key];
        var additionalProperties = options.reccurenceDefaults[key];
        
        // We have default properties we need to add to the current recurrence propery.  These are defined in
        // config.js in the gcal object.
        if (additionalProperties !== undefined) {
          for (var propertyName in additionalProperties) {
            line.push(";", propertyName.toUpperCase(), "=", additionalProperties[propertyName]);
          }
        }
        line.push(":");
        
        // If we have series of name-value pairs for a given property, we 
        // parse them out and add them.
        if (currentPropertyVal.propList === true) {
          line.push(this.parsePropertyList(currentPropertyVal));
        } else {
          line.push(currentPropertyVal);
        }
        
        recurrence.push(line.join(""));
      }
      
      for (var extraKey in options.reccurenceDefaults.toAppend) {
        var line = [];
        var extraVal = options.reccurenceDefaults.toAppend[extraKey];
        
        if (extraVal.block === true) {
          this.parseRecurrenceBlock(extraKey, extraVal, recurrence);
        }
      }
      
      return recurrence.join("\r\n");
    },
    
    /**
     * In this function, whatever is pushedto the recurrence is concatenated first, as there is no intermediate "line" array
     * that we use to concatenate the properties.  Because we will be joining the recurrence array elements with a 
     * "\r\n", we want to make sure each property of a block is on its own line.
     *
     * @param blockName - string name of the current property block
     * @param block - object containing iCal properties and values
     * @param recurrence - reference to the recurrence array
     */
    parseRecurrenceBlock: function(blockName, block, recurrence) {
      recurrence.push("BEGIN:" + blockName.toUpperCase());
      for (var propertyName in block) {
        if (propertyName === "block") {
          continue;
        }
        
        var propertyVal = block[propertyName];
        
        if (propertyVal.block === true) {
          this.parseRecurrenceBlock(propertyName, propertyVal, recurrence);
        } else if (propertyVal.propList === true) {
          recurrence.push(propertyName.toUpperCase() + "=" + this.parsePropertyList(propertyVal));
        } else {
          recurrence.push(propertyName.toUpperCase() + ":" + propertyVal);
        }
        
      }
      recurrence.push("END:" + blockName.toUpperCase());
    },
    
    /**
     * Parses an objects keys and values as a series of name-value pairs
     * separated by semicolons.
     *
     * @param propertyList - object containing iCal properties and values
     */
    parsePropertyList: function(propertylist) {
      var line = [];
      for (var propertyName in propertylist) {
        if (propertyName === "propList") {
          continue;
        }
        line.push(propertyName.toUpperCase(), "=", propertylist[propertyName], ";");
      }
      return line.join("");
    },
    
    /**
     * Given the full URI of the schedule, the acutal id is whatever follows
     * the last directory of the URI, so we parse that out and return it.
     *
     * @param fullIdUrl - Fully qualified URL to the calendar that contains the calendar's unique string ID.
     */
    parseScheduleId: function(fullIdUrl) {
      return fullIdUrl.substr(fullIdUrl.lastIndexOf("/") + 1);
    },
    
    /**
     * This will begin the overall process of exporting the Schedulr schedule to Google Calendar.
     * This will check if the user has already created a Google Calendar, and if they have, start
     * the event update process.  If they haven't, it will create a new one.  The calendar id is stored
     * in the database with the current schedule object, so that multiple calendars can be created.
     */
    exportSchedule: function() {
      var schedule = this.manager.currentSchedule();
      this.progressDialog = new GcalProgressDialog();
      
      this.manager.currentSchedule().doSave((function() {
        // Let's check to see if they already have a calendar...
        Ajax.silent(options.urls.getId, 
          { id: schedule.id },
          (function(gcalId) {
            if (gcalId.length > 1) {
              // They have a Google Calendar id for the current schedule, so let's try
              // to get the entry.
              
              this.gcalId = gcalId;
              this.service.getOwnCalendarsEntry(options.urls.idPrefixUrl + gcalId + options.urls.idSuffixUrl,
                 (function(result) { this.beginExport(); }).bind(this),
                 (function(error) {
                    // Maybe they deleted their calendar from Google Calendar? Lets let them know, and give them the option
                    // to create a new calendar.
                    
                    // Stop the progress dialog
                    this.progressDialog.stop();
                    this.makeDialog(this.loadErrorDialog, "Error Loading Google Calendar", {
                        "Export to New Schedule": (function() {
                            this.progressDialog = new GcalProgressDialog();
                            this.createDefaultCalendar();
                        }).bind(this),
                        "Retry Export": this.exportSchedule.bind(this),
                        "Cancel": undefined
                      },
                      {error: error});
                 }).bind(this)
              );
            } else {
              // This schedule does not have an associated Google Calendar id,
              // so create a new default one.
               
              this.createDefaultCalendar();
            }
          }).bind(this)
        );
      }).bind(this));
    },
    
    /**
     * Creates a calendar with the default parameters.
     */
    createDefaultCalendar: function() {
      this.createNewCalendar({
        description: {
          Title: this.manager.currentSchedule().name,
          Summary: "My class schedule from Schedulr."
        },
        properties: {
          //TimeZone: "America/New_York",
          Where: {
            Label: "Villanova, PA",
            ValueString: "Villanova, PA" 
          },
          Hidden: false,
          Color: "#2952A3"
        }
      });
    },
    
    /**
     * Given an object whose keys are fields in the CalendarEntry object,
     * this function will create a new CalendarEntry with the supplied data,
     * and then call onCreationSuccess when done.
     *
     * @param calendarData: object whose keys are fields in the CalendarEntry object.
     */
    createNewCalendar: function(calendarData) {
      this.progressDialog.updateStatus("Creating new calendar...");
      
      var calendar = this.createCalendarEntry(calendarData);
      
      this.service.insertEntry(options.feeds.create, calendar, 
        (function(result) {
          var schedule = this.manager.currentSchedule();
          this.gcalId = this.parseScheduleId(result.entry.id.$t);
          
          this.manager.currentSchedule().doSave((function() {
            Ajax.silent(options.urls.addId, {
                id: schedule.id,
                gcal_id: this.gcalId
              },
              this.onCreationSuccess.bind(this) // Our calendar was successfully created!
            );
          }).bind(this));
        }).bind(this),
        this.exportFailed.bind(this), 
        google.gdata.calendar.CalendarEntry);
    },
    
    /**
     * Called when a calendar is successfully created.
     */
    onCreationSuccess: function() {
      this.beginExport();
    },
    
    /**
     * Called when the export process is complete
     */
    exportCompleted: function() {
      this.progressDialog.stop();

      if (this.conflictedEvents.length > 0) {
        var conflictList = [];
        for (var i = 0; i < this.conflictedEvents.length; ++i) {
          var course = this.conflictedEvents[i].schedulr;
          var event = this.conflictedEvents[i].gcal;
          var date = new Date(event.getTimes()[0].startTime);
          var startTime = this.toReadableTime(date.getHours(), date.getMinutes());
          
          conflictList.push({
            courseTitle: course.title,
            eventTitle: event.getTitle().$t,
            day: course.day,
            time: startTime
          });
        }
        
        this.makeDialog(this.exportWarning, "Found Conflicts", undefined, {conflictList: conflictList});
      } else {
        this.makeDialog(this.exportSuccess, "Schedule Successfully Exported", undefined, {});
      }
    },
    
    exportFailed: function(error) {
      this.progressDialog.stop();
      
      
      // Yes, this is a hack to detect if Google sent us back some fun HTML without
      // telling us for our error.  Typically happens with HTTP 500 errors, and they 
      // don't include <html> tags, but do include <meta>s.
      if (error.indexOf("<meta") >= 0) {
        this.makeDialog(this.exportFailure, "Error Exporting Calendar", undefined, {errorMessage: ""});
        
        $("#htmlError").show();
        setTimeout(function() {
  				var doc = $("#htmlError")[0].contentWindow.document;
  				var frameBody = $('body', doc);
  				frameBody.html(error);
  			}, 1);
      } else {
        this.makeDialog(this.exportFailure, "Error Exporting Calendar", undefined, {errorMessage: error});
      }
    },
    
    toReadableTime: function(hours, minutes) {
      var timeOfDay = hours >= 12 ? "PM" : "AM";
      hours = hours - (hours > 12 ? 12 : 0);
      return hours.toPaddedString(2) + ":" + minutes.toPaddedString(2) + " " + timeOfDay;
    },
    
    /**
     * Given an object whose keys are also field names in a CalendarEntry object,
     * will conveniently construct a new CalendarEntry.
     *
     * @param calendarData - object to parse into a CalendarEntry
     */
    createCalendarEntry: function(calendarData) {
      var calendar = new google.gdata.calendar.CalendarEntry();

      for (var key in calendarData.description) {
        var text = google.gdata.Text.create(calendarData.description[key]);
        calendar["set" + key](text);
      }
      
      for (var key in calendarData.properties) {
        if (key !== "Where") {
          var property = new google.gdata.calendar[key + "Property"]();
          property["setValue"](calendarData.properties[key]);
          calendar["set" + key](property);
        }
      }
      
      // Yea, the world ain't perfect.  Our pretty little generic loop up there
      // won't handle the addLocation and Where beauties.
      if (calendarData.properties.Where !== undefined) {
        var location = new google.gdata.Where();
        location.setLabel(calendarData.properties.Where.Label);
        location.setValueString(calendarData.properties.Where.ValueString);
        calendar.addLocation(location);
      }
      
      return calendar;
    },
    
    /**
     * Returns true if the user has authenticated to Google Auth.
     * 
     * Note: this method will communicate with external servers if the user is
     *       authenticated.
     */
    isAuthenticated: function() {
      return google.accounts.user.checkLogin(options.scope);
    },
    
    /**
     * Redirects a user to Google's Authentication page.
     */
    authenticate: function() {
      var token = google.accounts.user.login(options.scope);
    },
    
    /**
     * Logs a user out of their Google account.
     */
    logout: function() {
      google.accounts.user.logout();
    }
  });
})(jQuery);

var GcalProgressDialog = (function($) {
  var options = $.extend(true, {}, $.config.gcal);

  return Class.create(Dialog, {
    initialize: function() {
      $.Views.getAll(this, options.templates);
      
      this.createAndShow(this.progressDialog.render.bind(this.progressDialog), 
                          'Exporting Schedule', 'gcalDialogInnerContainer', undefined, undefined, true);
      
      this.intervalId = 0;
      this.spinner = $(".spinner", this.container[0]);
      
      var dialog = this;
      this.animation = this.canvasEnabled() ? {
        startAnimation: function() {
          var canvasContext = dialog.spinner[0].getContext("2d");
          var image = new Image();
          var degrees = 0;
          image.src = options.images.spinner;
          
          dialog.intervalId = setInterval(function() {
            canvasContext.globalCompositeOperation = 'destination-over';
            canvasContext.save();           
            canvasContext.clearRect(0, 0, 100, 100);
            canvasContext.translate(50, 50);   
            canvasContext.rotate(Math.PI / 180 * (degrees  += 5));
            canvasContext.translate(-50, -50);
            canvasContext.drawImage(image, 0, 0);      
            canvasContext.restore();  
          }, 10);
        },
        
        stopAnimation: function() {
          clearInterval(dialog.intervalId);
        }
      } : undefined;

      this.start();
    },

    start: function() {
      this.spinner.fadeIn(200)
      
      $(".messageBoxButton", this.container[0]).hide();
      $(".closeButton", this.container[0]).hide();
      
      if (this.animation) {
        this.animation.startAnimation();
      }
    },
    
    stop: function() {
      if (this.animation) {
        this.animation.stopAnimation();
      }
      this.close();
    },
    
    updateStatus: function(status) {
      $(".status", this.container[0]).html(status);
    },
    
    canvasEnabled: function() {
      return !$.browser.msie || $.browser.version >= 9;
    }
  });
})(jQuery);
