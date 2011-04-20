/**
 * This file is the main file for driving the application.
 * At the bottom is a single function that is run on every page.
 * The setupSchedule and setupSemester functions are used for setting up the two pages respectively.
 */

(function($) {
  // creates a url to break the cache
  window.image_path = function(src) {
    return src+"?"+($.config.imageVersion);
  };
  
  // let people know they have been logged out if an ajax request fails
  window.loggedOut = function() {
    $.error("Unfortunately you have been logged out of Schedulr.  You should refresh the page or click <a href='/login' target='_blank'>here</a> to login again.");
  };
  
  // safely log a message
  $.log = function(msg) {
    window.console && console.log && console.log(msg);
  }
  
  $("#changeTerm").click(function() {
    $.messageString("Change Semester", $("#allTerms").html(), 'changeTermsPopup');
  });
})(jQuery);
 
function setupSchedule($) {
  Shadowbox.init();
  $.shadowTemplate = $.Views.get($.config.shadowTemplate);
  
  $.drillDownState = {
    departments: {},
    full: true,
    grad: true,
    undergrad: true,
    empty: false,
    times: []
  };
  for(var c = 0; c < schedulrData.departments.list.length; c++) {
    $.drillDownState.departments[schedulrData.departments.list[c].id] = true;
  }  
  drillDownCallbacks = createDrilldownFilters($);
  
  var searchEngine = new SearchEngine();
  var drillDownData = {
    textKey: 'text',
    items: [
      {text: 'Departments', callback: drillDownCallbacks.departments},
      {text: 'Requirements', callback: drillDownCallbacks.requirements},
      {text: 'Instructors', callback: drillDownCallbacks.instructors},
      {text: 'Times', callback: drillDownCallbacks.times},
      {text: 'Day of the Week', callback: drillDownCallbacks.days},
      {text: 'Search Results', callback: searchEngine.drillDownCallback.bind(searchEngine)}
    ]
  };
  
  $.scheduleManager = new ScheduleManager($("#scheduleContainer"), state);
  
  $.drillDown = $('#drillDownContainer').drillDown(drillDownData, function(obj) {
    if(obj.course && obj.times) {
      $.scheduleManager.currentSchedule().add(obj, true);
    }
  });
  $.drillDown.openRow(0, 0);
  
  $('#drillDownContainer').drillDownFilters();
  $.enrollmentManager = new Enrollment($("#scheduleContainer"));
  new HelpSystem($('a.helpLink'));
}

// hide green success message
setTimeout(jQuery.fn.fadeOut.bind($("#flash")), 10*1000);