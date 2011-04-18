/**
 * This single function sets up the filters and callback system for the drilldown.
 * This file is crazy.
 * This file is nasty.
 * There is nothing that can be done to fix it.  I have tried.
 */

function createDrilldownFilters($) {
  var drillDownFilters = {
    department: function(obj) {
      var id = obj.department_id || obj.id; 
      return id && $.drillDownState.departments[id];
    }, full: function(obj) {
      return $.drillDownState.full || ( // show if the full filter is off
        !$.enrollment || !$.enrollment[obj.id] || // show if no enrollment data
        $.enrollment[obj.id][0] != $.enrollment[obj.id][1] // show if capcity/current enrollment aren't equal
      )
    }, grad: function(obj) {
      if(obj.course) obj = obj.course;
      return $.drillDownState.grad || obj.number < 6000;
    }, undergrad: function(obj) {
      if(obj.course) obj = obj.course;
      return $.drillDownState.undergrad || obj.number >= 6000;
    }, times: function(obj) {
      var c, times = $.drillDownState.times, length = $.drillDownState.times.length, time;
      var d, courseTimes = obj.times, courseTimesLength = obj.times.length, courseTime, dayBits;
      for(c = 0; c < courseTimesLength; c++) {
        courseTime = courseTimes[c];
        dayBits = courseTime.dayBits();
        for(d = 0; d < length; d++) {
          time = times[d];
          if((time.days & dayBits) > 0) {
            switch(time.interval) {
              case 'before':
              case 'starting before':
                if(courseTime.start.compareValue < time.startCompare) return false;
                break;
              case 'after':
              case 'ending after':
                if(courseTime.end.compareValue > time.startCompare) return false;
                break;
              default:
                if(courseTime.end.compareValue > time.startCompare && courseTime.start.compareValue < time.endCompare) return false;
                break;
            }
          }
        }
      }
      return true;
    }, offerredThisSemester: function(obj) {
      return $.drillDownState.empty || obj.sections.length > 0;
    }, departmentEmpty: function(obj) {
      return obj.courses.length > 0;
    }, conflict: function(obj) {
      if(obj.sections) obj = obj.sections[0];
      return $.scheduleManager.currentSchedule().isConflict(obj) ? 'conflict' : '';
    },
    timeSelection: function(obj) {
      timeSelectManager = $.scheduleManager.currentSchedule().timeSelectManager;
      
      if (!timeSelectManager.selections.length) {
        return true;
      }
      
      if (!obj.times.length) {
        return false;
      }
            
      for (var i = 0; i < obj.times.length; ++i) {
        var time = obj.times[i];
        var show = false;
        
        for (var j = 0; j < timeSelectManager.selections.length; ++j) {
          var selection = timeSelectManager.selections[j];
          
          if (!selection) {
            continue;
          }
          
          if (time.day == selection.day) {
            var selectionStartCompare = (selection.startTime.hours * 60) + selection.startTime.minutes;
            var selectionEndCompare = (selection.endTime.hours * 60) + selection.endTime.minutes;
            if (time.start.compareValue >= selectionStartCompare && time.end.compareValue <= selectionEndCompare) {
              show = true;
              break;
            }
          }
        }
        
        if (!show) {
          return false;
        }
      }
      
      return true;
    }
  };
  $.drillDownFilters = drillDownFilters;
  
  var keys = Object.keys(drillDownFilters);
  for(var c = 0; c < keys.length; c++) {
    (function(k) {
      var fn = drillDownFilters[k];
      drillDownFilters['course'+k.capitalize()] = function(obj) {
        for(var c = 0, len = obj.courses.length; c < len; c++) {
          if(fn(obj.courses[c])) return true;
        }
        return false;
      };
      drillDownFilters['section'+k.capitalize()] = function(obj) {
        var courses = obj.sections.pluck('course');
        for(var c = 0, len = courses.length; c < len; c++) {
          if(fn(courses[c])) return true;
        }
        return false;
      };
      drillDownFilters['courseSection'+k.capitalize()] = function(obj) {
        return fn(obj.course);
      };
      drillDownFilters['courseSections'+k.capitalize()] = function(obj) {
        var sections = obj.sections;
        for(var c = 0, len = sections.length; c < len; c++) {
          if(fn(sections[c])) return true;
        }
        return false;
      };
    })(keys[c]);
  }
  
  var ti = drillDownFilters.times;
  drillDownFilters.timesFilter = function(time) {
    if(time.sections.length === 0) return false;
    return ti(time.sections[0]);
  }
  
  var drillDownCallbacks = {
    sectionFilters: [
      drillDownFilters.times,
      drillDownFilters.full,
      drillDownFilters.timeSelection
    ],
    timeSectionFilters: [
      drillDownFilters.times,
      drillDownFilters.full,
      drillDownFilters.courseSectionDepartment,
      drillDownFilters.courseSectionGrad,
      drillDownFilters.courseSectionUndergrad
    ],
    departmentFilters: [
      drillDownFilters.department,
      drillDownFilters.departmentEmpty
    ],
    courseFilters: [
      drillDownFilters.department,
      drillDownFilters.courseSectionsFull,
      drillDownFilters.grad,
      drillDownFilters.undergrad,
      drillDownFilters.offerredThisSemester
    ],
    requirementCourseFilters: [
      drillDownFilters.courseSectionsFull,
      drillDownFilters.grad,
      drillDownFilters.undergrad,
      drillDownFilters.offerredThisSemester
    ],
    timeFilters: [
      drillDownFilters.timesFilter,
      drillDownFilters.sectionDepartment,
      drillDownFilters.full,
      drillDownFilters.sectionGrad,
      drillDownFilters.sectionUndergrad
    ],
    instructorFilters: [
      drillDownFilters.sectionDepartment,
      drillDownFilters.full,
      drillDownFilters.sectionGrad,
      drillDownFilters.sectionUndergrad
    ],
    
    departments: function(node) {
      return {
        items: d.departments.list,
        textKey: 'name',
        callback: drillDownCallbacks.courses,
        filters: drillDownCallbacks.departmentFilters
      };
    },
    requirements: function(node) {
      return {
        items: d.requirements.list,
        textKey: 'name',
        callback: drillDownCallbacks.requirementCourses
      };
    },
    requirementCourses: function(obj) {
      return {
        items: obj.courses,
        textKey: 'title',
        callback: drillDownCallbacks.sections,
        filters: drillDownCallbacks.requirementCourseFilters
      };
    },
    instructors: function(node) {
      return {
        items: d.instructors.grouped,
        textKey: 'letter',
        callback: drillDownCallbacks.instructorGroup,
        filters: []
      };
    },
    instructorGroup: function(node) {
      return {
        items: node.instructors,
        textKey: 'ddt',
        callback: drillDownCallbacks.instructorSections,
        filters: drillDownCallbacks.instructorFilters
      };
    },
    instructorSections: function(obj) {
      return {
        items: obj.sections,
        textKey: 'title',
        classCallback: drillDownFilters.conflict,
        callback: drillDownCallbacks.sectionDetails,
        filters: drillDownCallbacks.sectionFilters
      };
    },
    times: function(node) {
      return {
        items: d.times,
        textKey: 'hour',
        callback: drillDownCallbacks.hours,
        filters: []
      };
    },
    hours: function(node) {
      return {
        items: node.times,
        textKey: 'time',
        classCallback: drillDownFilters.conflict,
        callback: drillDownCallbacks.timeSections,
        filters: drillDownCallbacks.timeFilters
      };
    },
    days: function(node) {
      return {
        items: d.days,
        textKey: 'days',
        callback: drillDownCallbacks.dayTimes
      };
    },
    dayTimes: function(obj) {
      return {
        items: obj.times,
        textKey: 'time',
        classCallback: drillDownFilters.conflict,
        callback: drillDownCallbacks.timeSections,
        filters: drillDownCallbacks.timeFilters
      };
    },
    timeSections: function(obj) {
      return {
        items: obj.sections,
        textKey: 'title',
        classCallback: drillDownFilters.conflict,
        callback: drillDownCallbacks.sectionDetails,
        filters: drillDownCallbacks.timeSectionFilters
      };
    },
    courses: function(obj) {
      return {
        items: obj.courses,
        textKey: 'title',
        callback: drillDownCallbacks.sections,
        filters: drillDownCallbacks.courseFilters
      };
    },
    sections: function(obj) {
      return {
        items: obj.sections,
        textKey: 'ddt',
        classCallback: drillDownFilters.conflict,
        callback: drillDownCallbacks.sectionDetails,
        filters: drillDownCallbacks.sectionFilters
      };
    },
    sectionDetails: function(obj) {
      return {
        item: obj,
        details: true,
        links: [{
          text: 'Schedule Course',
          callback: function(obj) {
            $.scheduleManager.currentSchedule().add(obj, true);
          }
        }]
      };
    }
  };
  $.drillDownCallbacks = drillDownCallbacks;
  
  return drillDownCallbacks;
}