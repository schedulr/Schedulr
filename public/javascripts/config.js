/**
 * This file specifies system wide settings in a single location.
 */

jQuery.config = {
  cookieExpiration: null,
  currentVersion: 3,
  imageVersion: 1302145525,
  handleErrors: false,
  
  search: {
    url: '/main/save_search'
  },
  
  drillDown: {
    templates: {
      root: 'drilldown/',
      panel: 'panel',
      detailsPanel: 'detailsPanel',
      filtersTemplate: 'filters'
    },
    panelWidth: 210,
    detailsPanelWidth: 285,
    maxZIndex: 100
  },
  
  feedback: {
    templates: {
      dialog: 'popups/feedback',
      radios: 'popups/radios'
    },
    url: '/main/feedback'
  },

  drillDownFilters: {
    templates: {
      root: 'drilldown/',
      filtersTemplate: 'filters',
      timeFilters: 'timeFilters',
      timesList: 'timesList'
    },
    urls: {
      state: "/schedule/set_state"
    }
  },
  
  tooltips: {
    offset: 110,
    spacing: 20,
    templates: {
      alert: 'tooltips/alert',
      tooltip: 'tooltips/tooltip'
    }
  },

  schedule: {
    templates: {
      sidebar: "sidebar/sidebar",
      sidebarSchedules: "sidebar/schedules",
      schedule: "schedule/schedule",
      section: "schedule/section",
      popup: "utils/popup",
      conflictDialog: 'popups/conflictDialog',
      crns: 'popups/crns',
      renameScheduleTemplate: 'popups/renameSchedule',
      details: 'schedule/details',
      shareDialog: 'schedule/shareDialog',
      registerDialog: 'popups/registerDialog',
      print: 'schedule/print'
    },
    interval: 1000*60*2,
    urls: {
      create: "/schedule/new",
      update: "/schedule/update",
      destroy: "/schedule/destroy",
      share: "/schedule/share",
      unshare: "/schedule/unshare",
      unshareWithMe: "/schedule/unshareWithMe",
      data: "/schedule/share_data"
    }
  },
  
  gcal: {
    templates: {
      loadErrorDialog: "gcal/loadError",
      redirectNotificationDialog: "gcal/redirectNotification",
      progressDialog: "gcal/progressDialog",
      exportSuccess: "gcal/exportSuccess",
      exportWarning: "gcal/exportWarning",
      exportFailure: "gcal/exportFailure"
    },
    images: {
      animatedSpinner: "/images/spinner_fast.gif",
      spinner: "/images/spinner.png",
      success: "/images/success.png",
      failure: "/images/failure.png",
      warning: "/images/warning.png"
    },
    urls: {
      idPrefixUrl: "https://www.google.com/calendar/feeds/",
      idSuffixUrl: "/private/full",
      addId: "/main/add_gcal_id",
      getId: "/main/get_gcal_id"
    },
    service: undefined,
    scope: "https://www.google.com/calendar/feeds/",
    feeds: {
      create: "https://www.google.com/calendar/feeds/default/owncalendars/full",
      getAll: "https://www.google.com/calendar/feeds/default/allcalendars/full"
    },
    daystring: ["MO", "TU", "WE", "TH", "FR"],
    fullDaystring: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    reccurenceDefaults: {
      dtstart: {
        tzid: "America/New_York"
      },
      dtend: {
        tzid: "America/New_York"
      },
      toAppend: {
        vtimezone: {
          block: true,
          tzid: "America/New_York",
          "x-lic-location": "America/New_York",
          standard: {
            block: true,
            tzoffsetfrom: "-0400",
            tzoffsetto: "-0500",
            tzname: "EST",
            dtstart: "19671029T020000",
            rrule: {
              propList: true,
              freq: "YEARLY",
              bymonth: 10,
              byday: "-1SU"
            }
          },
          daylight: {
            block: true,
            tzoffsetfrom: "-0500",
            tzoffsetto: "-0400",
            tzname: "EDT",
            dtstart: "19870405T020000",
            rrule: {
              propList: true,
              freq: "YEARLY",
              bymonth: 4,
              byday: "1SU"
            }
          }
        }
      }
    }
  },
  
  timeSelect: {
    eventTargets: {
      timeSelectContainer: {
        mousedown: true,
        mousemove: true,
        mouseup: true,
        mouseenter: true
      },
      selection: {
        // We define a handler for clicks on selections in timeSelectManager.js, so we don't want to handle it
        // if it happens on the container.
        mousedown: false,
        mousemove: true,
        mouseup: true,
        mouseenter: true
      },
      startTimeLabel: {
        mousedown: true,
        mousemove: true,
        mouseup: true,
        mouseenter: true
      },
      endTimeLabel: {
        mousedown: true,
        mousemove: true,
        mouseup: true,
        mouseenter: true
      }
    },
    containerZIndex: 100,
    selection: {
      boxWidth: 99,
      dayColumnWidth: 106,
      minHeight: 16,
      timeInterval: 5,
      timeLabelOffset: 25,
      timeLabelDelta: 60,
      timeLabelHeight: 20,
      cursorOffset: 5
    },
    mouseEvent: {
      left: 1
    },
    
  },
  
  help: {
    templates: {
      helpTemplate: 'help/schedule'
    },
    urls: {
      version: "/main/set_version"
    }
  },

  views: {
    root: '/views/',
    extension: '.haml'
  },
  
  enrollment: {
    templates: {
      enrollmentSidebar: "schedule/enrollment"
    },
    refresh: 60,
    url: '/javascripts/generated/enrollment.js',
    low: 5,
    highlightColor: '#FF0',
    highlightDuration: 4000
  },
  
  shadowTemplate: 'utils/drillDownDropShadow',
  dialogTemplate: 'utils/dialog'
};
