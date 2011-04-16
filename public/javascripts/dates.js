function timeString(hour, minute) {
  var str = "";
  str += (hour === 12 ? hour : hour % 12)+":";
  str += (minute < 10 ? '0' : '')+minute+" ";
  str += (hour < 12 ? 'AM' : 'PM');
  return str;
}
/**
 * This class represents the concept of a time, an hour/minute pair with no associated date.
 * The date object implicitly uses the date for comparison, but a weekly course has no date, just a time.
 * The paramters to the constructor can be a date object, a SchedulrTime object, or a 2 element array of hour/minutes.
 */
var SchedulrTime = Class.create({
  initialize: function(param) {
    if(param.length) {
      this.hours = parseInt(param[0]);
      this.minutes = parseInt(param[1]);
    } else if(param.getHours) {
      this.hours = param.getHours();
      this.minutes = param.getMinutes();
    } else {
      this.hours = param.hours;
      this.minutes = param.minutes;
    }
    
    this.date = new Date();
    this.update();
  },

  /**
   * Update the date object and compareValue with the new hour/minutes.
   */
  update: function() {
    this.date.setHours(this.hours);
    this.date.setMinutes(this.minutes);
    this.compareValue = this.hours*60 + this.minutes;
  },

  /**
   * Copies the object.
   */
  clone: function() {
    return new SchedulrTime([this.hours, this.minutes]);
  },

  /**
   * Returns the difference in time between this object and another.
   */
  compareTo: function(other) {
    return this.compareValue - other.compareValue;
  },

  /**
   * Increments this time by a certain number of minutes.  Minutes can be any integer.
   */
  addMinutes: function(minutes) {
    this.minutes += minutes;
    var diff = this.minutes % 60;
    this.hours += (this.minutes - diff) / 60;
    this.minutes = diff;
    this.update();
  },

  /**
   * Returns the time as h:mm
   */
  toString: function() {
    var h = this.hours % 12;
    if(h === 0)
      h = 12;
    
    var m = (this.minutes < 10 ? "0" : "") + this.minutes;
    return h+":"+m;
  }
});

/**
 * This class extends the weekly time concept of SchedulrTime by adding days of the week to a time.
 * The class is intended to model one time during which a course is taught.
 * As such, it consists of a start time, end time, and day of the week.
 */
var SchedulrDate = Class.create({
  initialize: function(day, start, end, location) {
    this.start = start;
    this.end = end;
    this.day = day;
    this.location = location;
  },
  
  dayBits: function() {
    return Math.pow(2, this.day);
  },

  /**
   * Returns true if the time range of another object overlaps with this one.
   */
  conflicts: function(other) {
    //if both the start and end times are before or both are after the other date, then they do not conflict either
    //if the day of the week is not the same, then no conflict exists
    var startCompare = this.start.compareTo(other.end);
    var endCompare = this.end.compareTo(other.start);
    return other.day === this.day && !(startCompare > 0 || endCompare < 0);
  },

  /**
   * Copies the object
   */
  clone: function() {
    return new SchedulrDate(this.day, this.start.clone(), this.end.clone());
  },

  /**
   * Returns true if the start time, end time, and days match.
   */
  equals: function(other) {
    return other.start.compareTo(this.start) === 0 && other.end.compareTo(this.end) === 0 && this.day === other.day;
  }
});

/**
 * This class represents a set of date objects.
 * The idea is that a course could be taught MWF at one time, but also have a class Thursday at a different time.
 * So this class stores an array of date objects.
 * Additionally, two courses may conflict with each other.  Their times can still be stored in this class by extending each of the date objects with the new time.
 * So, this class stores an array of date objects, none of which overlap.
 */
var SchedulrSlot = Class.create({
  initialize: function(dates) {
    this.dates = [];
    this.addDates(dates);
  },

  /**
   * Helper function for adding multiple dates fast.
   */
  addDates: function(dates) {
    for(var c = 0; c < dates.length; c++) {
      this.addDate(dates[c]);
    }
  },

  /**
   * Adds the given date to the list of dates.
   * If the date conflicts with any of the times, then it is merged with them.
   * A date can conflict with multiple times, so multiple mergers may be needed.
   */
  addDate: function(date) {
    date = date.clone();
    //find out if any of the current dates overlap
    var conflicts = this.findConflicts(date);
    
    //create a single date object representing all of the times between this date and the conflicts
    for(var c = 0; c < conflicts.length; c++) {
      this.mergeDateTimes(date, conflicts[c]);
    }
    
    //remove all the conflicted dates
    for(var d = 0; d < conflicts.length; d++) {
      for(var c = 0; c < this.dates.length; c++) {
        if(this.dates[c].equals(conflicts[d])) {
          this.dates.remove(c);
          break;
        }
      }
    }
    
    this.dates.push(date);
  },

  /**
   * Creates a list of all the dates taught on the same day as this date but with conflicting times
   */
  findConflicts: function(date) {
    var conflicts = [];
    for(var c = 0; c < this.dates.length; c++) {
      if(this.dates[c].conflicts(date)) {
        conflicts.push(this.dates[c]);
      }
    }
    return conflicts;
  },

  /**
   * Merges newDate into currentDate by extending the start/end times of currentDate if they are later/sooner than newDate.
   */
  mergeDateTimes: function(currentDate, newDate) {
    var startCompare = currentDate.start.compareTo(newDate.start);
    var endCompare = currentDate.end.compareTo(newDate.end);
    if(startCompare > 0) {
      currentDate.start = newDate.start;
    } if(endCompare < 0) {
      currentDate.end = newDate.end;
    }
  },

  /**
   * Returns true if any of the dates of the two slots conflict.
   */
  conflicts: function(other) {
    for(var c = 0; c < other.dates.length; c++) {
      for(var d = 0; d < this.dates.length; d++) {
        if(this.dates[d].conflicts(other.dates[c]))
          return true;
      }
    }
    return false;
  },
  
  /**
   * Merges two slots by adding the other's dates into this ones.
   */
  merge: function(other) {
    this.addDates(other.dates);
  }
});

/**
 * This class associates a list of courses with a slot
 */
var SchedulrCourseSlot = Class.create({
  initialize: function(course) {
    this.courses = [course];
    this.slot = new SchedulrSlot(course.times);
  },
  conflicts: function(other) {
    return this.slot.conflicts(other.slot);
  },
  merge: function(other) {
    this.slot.merge(other.slot);
    this.courses.push.apply(this.courses, other.courses);
  }
});