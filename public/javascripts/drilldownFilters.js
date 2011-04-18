/**
 * This class represents the filter settings for the drilldown such as which departments to show
 * and whether to show grad/undergrad courses.
 */
(function($) {
  $.fn.drillDownFilters = function(o) {
    var options = $.extend(true, {}, $.fn.drillDownFilters.defaults, $.config.drillDownFilters, o);
    
    var DrillDownFilters = Class.create({
      initialize: wrap(function(container, drilldown) {
        this.container = container;
        
        $.Views.getAll(this, options.templates);
        
        var cookieState = this.readState();
        if(cookieState) {
          $.drillDownState = $.extend(true, $.drillDownState, cookieState);
          $.drillDown.openRow(0,0);
        }
        
        $('.changeFilters').live('click', this.showDialog.wrap(this));
      }),
      
      showDialog: function() {
        var t = this;
        
        var dialog = new Dialog((function() { return this.filtersTemplate.render({timesTemplate: this.timeFilters}); }).bind(this), undefined, undefined, function() { $("#filtersContainer").remove(); });
        this.renderTimes();
        dialog.shadow.wrap('<div id="filtersContainer"></div>');
        dialog.show();
        
        function departmentCallback(checkbox) {
          var departmentid = parseInt(checkbox.attr('name').split('-')[1]);
          if(!departmentid) return;
          $.drillDownState.departments[departmentid] = checkbox.attr('checked');
          t.writeState();
        }
        
        function updateCheckboxState(checkbox) {
          var parent = checkbox.closest('.switch');
          var enabled = $('.cbEnabled', parent[0]);
          var disabled = $('.cbDisabled', parent[0]);
          
          var checked = checkbox.is(':checked');
          if(checked) {
            enabled.addClass('selected');
            disabled.removeClass('selected');
          } else {
            disabled.addClass('selected');
            enabled.removeClass('selected');
          }
          
          switch(checkbox.attr('id')) {
            case 'fullFilter':
              $.drillDownState.full = checked;
              break;
            case 'undergradFilter':
              $.drillDownState.undergrad = checked;
              break;
            case 'gradFilter':
              $.drillDownState.grad = checked;
              break;
            case 'emptyFilter':
              $.drillDownState.empty = checked;
              break;
          }
          t.writeState();
        }
        
        $('.cbEnabled', dialog.container).click(wrap(function() {
          var checkbox = $('.checkbox', $(this).closest('.switch')[0]);
          checkbox.attr('checked', true);
          updateCheckboxState(checkbox);
          departmentCallback(checkbox);
        }));
        
        $('.cbDisabled', dialog.container).click(wrap(function() {
          var checkbox = $('.checkbox', $(this).closest('.switch')[0]);
          checkbox.attr('checked', false);
          updateCheckboxState(checkbox);
          departmentCallback(checkbox);
        }));
        
        function allCallback(newValue) {
          $('input.departmentCheckbox', dialog.container).each(function() {
            $(this).attr('checked', newValue);
            updateCheckboxState($(this));
          });
          
          for(var key in $.drillDownState.departments) {
            $.drillDownState.departments[key] = newValue;
          }
          this.writeState();
        }
        //callbacks to toggle/untoggle every department
        $('#filtersCheckAll').click(allCallback.wrap(this, true));
        $('#filtersUncheckAll').click(allCallback.wrap(this, false));
        
        $('#addTimeButton').click(wrapEvent(this, function(elem) {
          this.saveTime(elem.parents('#filtersTable'));
          this.writeState();
        }));
        
        $('input[name=interval]').click(wrap(function() {
          if($(this).val() === 'during') {
            $('#endTimeBox').show();
          } else {
            $('#endTimeBox').hide();
          }
        }));
      },
      
      saveTime: function(node) {
        var time = {};
        time.monday = $('input[name=monday]', node).is(':checked');
        time.tuesday = $('input[name=tuesday]', node).is(':checked');
        time.wednesday = $('input[name=wednesday]', node).is(':checked');
        time.thursday = $('input[name=thursday]', node).is(':checked');
        time.friday = $('input[name=friday]', node).is(':checked');
        
        var days = 0;
        if(time.monday) days = days | 1;
        if(time.tuesday) days = days | 2;
        if(time.wednesday) days = days | 4;
        if(time.thursday) days = days | 8;
        if(time.friday) days = days | 16;
        time.days = days;
        
        var intervals = $('input[name=interval]', node);
        if($(intervals[0]).is(':checked')) time.interval = 'before';
        if($(intervals[1]).is(':checked')) time.interval = 'during';
        if($(intervals[2]).is(':checked')) time.interval = 'after';
        
        var startTime = $('input[name=startTime]', node).val();
        var endTime = $('input[name=endTime]', node).val();
        
        var startDate = new Date("1/1/10 "+startTime);
        var endDate = new Date("1/1/10 "+endTime);
        
        if(startTime == 'Invalid Date') {
          $.error('Oops! We couldn\'t figure out what the start time you entered was.  Try entering it in this format: HH:MM AM');
          return;
        }
        time.startHour = startDate.getHours();
        time.startMinute = startDate.getMinutes();
        time.startCompare = time.startHour*60 + time.startMinute;
        
        if(time.interval === 'during') {
          if(endTime == 'Invalid Date') {
            $.error('Oops! We couldn\'t figure out what the end time you entered was.  Try entering it in this format: HH:MM AM');
            return;
          }
          
          time.endHour = endDate.getHours();
          time.endMinute = endDate.getMinutes();
          time.endCompare = time.endHour*60 + time.endMinute;
        }
        if(time.interval === 'before') time.interval = 'starting before';
        if(time.interval === 'after') time.interval = 'ending after';
        
        time.str = this.timeString(time);
        
        $.drillDownState.times.push(time);
        $.scheduleManager.currentSchedule().render();
        this.renderTimes();
      },
      
      renderTimes: function() {
        var html = this.timesList.render();
        $('#timesList').html(html);
        $('a', $('#timesList')).click((function(link) {
          var clas = link.attr('class');
          var index = parseInt(clas.split('-')[1]);
          $.drillDownState.times.remove(index);
          $.scheduleManager.currentSchedule().render();
          this.writeState();
          this.renderTimes();
        }).bindEvent(this));
      },
      
      formatTime: function(hour, minute) {
        minute = minute < 10 ? "0"+minute : ""+minute;
        if(hour === 0) {
          return "12:"+minute+" AM";
        }
        if(hour < 12) {
          return hour+":"+minute+" AM";
        }
        if(hour === 12) {
          return "12:"+minute+" PM";
        }
        return (hour-12)+":"+minute+" PM";
      },
      
      timeString: function(time) {
        var str = ['Hide courses', time.interval, this.formatTime(time.startHour, time.startMinute)];
        if(time.interval === 'during') {
          str.push('and', this.formatTime(time.endHour, time.endMinute));
        }
        str.push('on');
        
        var days = '';
        if(time.monday) days += 'M';
        if(time.tuesday) days += 'T';
        if(time.wednesday) days += 'W';
        if(time.thursday) days += 'R';
        if(time.friday) days += 'F';
        str.push(days);
        
        return str.join(' ');
      },

      /**
       * Reads the filters from a cookie and updates the state variables appropriately.
       */
      readState: function() {
        var cookieState = $.cookie('drillDownState');
        if(!Object.empty(cookieState)) {
          var obj = eval("("+cookieState+")");
          $.cookie('drillDownState', null);
          this.writeState();
          return obj;
        }
        return state.state;
      },

      /**
       * Writes the current state to a cookie.
       */
      writeState: function() {
        if(this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(this.doWrite.bind(this), 5000);
      },
      
      doWrite: function() {
        this.timeout = undefined;
        var str = Object.toJSON($.drillDownState);
        Ajax.request(options.urls.state, {data: {state: Object.toJSON($.drillDownState)}});
      }
    });
    return new DrillDownFilters($(this));
  };
  $.fn.drillDownFilters.defaults = {
    templates: {
      root: '/schedule/views/',
      filtersTemplate: 'filters'
    }
  };
})(jQuery);