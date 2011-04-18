var TimeSelectManager = (function($) {
  var options = $.extend(true, {}, $.config.timeSelect);
  
  return Class.create({
    initialize: function(schedule) {
      this.schedule = schedule;
      this.selections = [];
      this.visibleSelectionsMask = 0;
      this.selectionInProgress = false;
      this.source = undefined;
      this.doubleClickTimeout = undefined;
    },
    
    selectionEvent: function(eventData) {
      if (eventData.which != options.mouseEvent.left) {
        return true;
      }
      
      // Stops text selection when dragging
      eventData.preventDefault();
      
      // Dumb IE doesn't have target property, but has srcElement, and they are the same.
      if ($.browser.msie) {
        eventData.target = eventData.srcElement;
      }
      
      // Make sure our mouse event is actually registering on something we want it to.
      if (options.eventTargets[eventData.target.className]) {
        // If that class has not defined an explicit action for the event...
        if (options.eventTargets[eventData.target.className][eventData.type] !== false) {
          this[eventData.type](eventData);
        }
      }
      return false;
    },
    
    mousedown: function(eventData) {
      if (!this.doubleClickTimeout) {
        this.selectionInProgress = true;
        
        this.doubleClickTimeout = setTimeout((function () {
          if (this.selectionInProgress) {
            this.doubleClickTimeout = undefined;
            this.mouseDownImpl(eventData);
          }
        }).wrap(this), 80);
      } else {
        clearTimeout(this.doubleClickTimeout);
        this.doubleClickTimeout = undefined;
        this.removeAllSelections();
      }
    },
    
    mouseDownImpl: function(eventData) {
      this.source = $(eventData.target);
      
      // We show the canvas on which we draw the selections.  This makes sure that the schedule boxes themselves
      // won't receive any mouse events to screw up dragging.
      this.showSelectionContainer(true);
      
      var x = eventData.layerX;
      var y = eventData.layerY;
      
      if ($.browser.msie) {
        x = eventData.offsetX;
        y = eventData.offsetY;
      }
      
      // This will essentially snap the selection's left edge to the nearest column start for each day.  It just makes sure
      // the box is drawn at the left edge of the column in which the selection was started.
      var normalizedLeft = this.roundToNearest(x, options.selection.dayColumnWidth);
      var normalizedTop = this.roundToNearest(y, options.selection.timeInterval);
      
      this.addSelection(normalizedLeft, normalizedTop);
    },
    
    mouseup: function(eventData) {
      this.selectionInProgress = false;
      
      var selection = this.getCurrentSelection();
      if (selection && (selection.box.height() < options.selection.minHeight)) {
        this.removeSelection(selection.id);
        return;
      }      
      $.drillDown.openRow(0, 0);  
    },
    
    mousemove: function(eventData) {
      if (this.selectionInProgress && eventData.which === options.mouseEvent.left) {
        if (this.doubleClickTimeout !== undefined) {
          clearTimeout(this.doubleClickTimeout);
          this.doubleClickTimeout = undefined;
          this.mouseDownImpl(eventData);
        }
      
        var selection = this.getCurrentSelection();
        if (!selection) {
          return true;
        }
        
        // Gets left and top of selection div relative to the container on which we are drawing them.
        var relativeLeft = (eventData.pageX - this.source.offset().left);
        var relativeTop = (eventData.pageY - this.source.offset().top);
        
        // If the current mouse position in the drag has crossed over to the next column, then we want to
        // draw a new selection box.
        if (relativeLeft > (selection.left + options.selection.dayColumnWidth)) {
          // We just ignore selections less than our min height to allow the user to skip day columns in their selections.
          if (selection.box.height() < options.selection.minHeight) {
            this.showCurrentSelection(false);
          }
          
          // Again, add the selection aligned with the column.
          selection = this.addSelection(this.roundToNearest(relativeLeft, options.selection.dayColumnWidth), relativeTop);
        } else if (relativeLeft < selection.left) {
          // this means that they are going left in their selection, and they are essentially unselecting, so we
          // remove the most recent selection.
          
          this.removeSelection();
          this.showCurrentSelection(true);
          selection = this.getCurrentSelection();
          $.log(this.selections);
          if (!selection) {
            return true;
          }
        }
        
        var selectionHeight = this.normalize(selection.top, relativeTop);
        var selectionWidth = this.normalize(selection.left, relativeLeft);
        
        if (selectionHeight.first >= 0 && selectionHeight.second <= this.source.height()) {
          selection.box.css({
            'top': selectionHeight.first,
            'height': Math.abs(selectionHeight.first - selectionHeight.second) - options.selection.cursorOffset,
            'left': selectionWidth.first
          });
          
          this.drawTimeLabels(selection, selectionHeight.first, selectionHeight.second);
        }
      }
    },
    
    dblclick: function(eventData) {
      this.removeAllSelections();
    },

    roundToNearest: function(numberToTruncate, denominator) {
      return (Math.floor(numberToTruncate / denominator) * denominator);
    },
    
    /**
     *  Callback function that is called when the mouse is released outside of the selection
     *  container.  This will essentially be used to detect if the person has released
     *  the left click outside of container while they are click-dragging, so we can act
     *  appropriately.
     **/
    externalMouseReleased: function(eventData) {
      this.selectionInProgress = false;
    },
    
    /**
     *  Draws the labels on the top and bottom of a selection div that represent the
     *  start and ending times of that selection.  The reason that the top and bottom
     *  of the selection are explicitly passed in and not just read from the selection object
     *  is because the selection object doesn't hold updated values for its top and bottom
     *  due to the need to normalize (i.e., figuring out where to draw the div when selecting 
     *  both upwards and downwards) the two values at each stage of the selection, which requires
     *  saving the original top value of the selection div .
     */
    drawTimeLabels: function(selection, topOfSelection, bottomOfSelection) {
      var startTime = this.getTimeForHeight(topOfSelection);
      var endTime = this.getTimeForHeight(bottomOfSelection);
      
      var startLabel = selection.startTime.label;
      var endLabel = selection.endTime.label;
      startLabel.html(startTime.string);
      endLabel.html(endTime.string);
      
      selection.startTime.hours = startTime.hours;
      selection.startTime.minutes = startTime.minutes;
      selection.endTime.hours = endTime.hours;
      selection.endTime.minutes = endTime.minutes;
      
      startLabel.css({
        'top': topOfSelection - options.selection.timeLabelHeight + 1,
        'left': selection.left
      });
      
      endLabel.css({
        'top': bottomOfSelection - 2,
        'left': selection.left
      });
      
      if (startLabel.is(":hidden")) {
        startLabel.fadeIn(options.selection.fadeDuration);
      }
      if (endLabel.is(":hidden")) {
        endLabel.fadeIn(options.selection.fadeDuration);
      }
    },
    
    /**
     * Normalize will essentially be used to figure out where to draw the selection div, in the sense that
     * it will give the correct top and bottom coordinates for the selection div, regardless of the direction
     * (up or down) that the user is selecting.
     **/
    normalize: function(firstY, secondY) {
      return {
        first: Math.min(firstY, secondY),
        second: Math.max(firstY, secondY)
      }
    },
    
    addSelection: function(left, top) {
      var box = $('<div class="selection"></div>');
      box.css({
        'left': left,
        'top': top,
        width: options.selection.boxWidth,
      });
      
      this.source.append(box);
      
      var selection = {
        startTime: {
          hours: 0,
          minutes: 0,
          label: $('<div class="startTimeLabel"></div>')
        },
        endTime: {
          hours: 0,
          minutes: 0,
          label: $('<div class="endTimeLabel"></div>')
        },
        day: (left / options.selection.dayColumnWidth),
        id: this.selections.length,
        left: left,
        top: top,
        box: box
      };
      
      this.source.append(selection.startTime.label);
      this.source.append(selection.endTime.label);
      
      // Add a handler to delete a selection when a user ctrl-clicks it in multi-select
      // mode.
      box.bind("mousedown", (function(eventData) {
        if (eventData.which == options.mouseEvent.left) {
          this.removeSelection(selection.id);
        }
      }).wrap(this));
      
      // Draw the time labels, and draw the bottom one about 4 pixels below the
      // line that will be the selection before the user has dragged it.  This will make
      // sure it is at a nice position below the selection line.
      this.drawTimeLabels(selection, selection.top, selection.top + 4);
      
      this.selections.push(selection);
      this.visibleSelectionsMask |= (1 << selection.id);
      return selection;
    },
    
    getTimeForHeight: function(relativeHeight) {
      var hourSpan = (relativeHeight / options.selection.timeLabelDelta).floor();
      var hours = (this.schedule.startTime.hours + hourSpan);
      var minutes = relativeHeight % options.selection.timeLabelDelta;
      return {
        hours: hours,
        minutes: minutes,
        string: timeString(hours, minutes)
      };
    },
    
    removeSelection: function(index) {
      var selection = undefined;
      if (index !== undefined) {
        selection = this.selections[index];
        this.selections[index] = undefined;
      } else {
        selection = this.selections.pop();
      }
      
      if (selection) {
        this.visibleSelectionsMask &= ~(1 << selection.id);
        
        var selectingDone = false;
        var removeCallback = function(jQueryObj) {
          jQueryObj.remove();
          if (!this.visibleSelectionsMask && !selectingDone) {
            selectingDone = true;
            this.endSelectionSession();
          }
        };
        
        selection.box.add(selection.startTime.label)
                     .add(selection.endTime.label)
                     .animate({ 'opacity': 0 }, {
                       complete: removeCallback.wrapEvent(this),
                       duration: options.selection.fadeDuration,
                       queue: false
                     });
      }
    },
    
    removeAllSelections: function() {
      for (var i = 0; i < this.selections.length; ++i) {
        this.removeSelection(i);
      }
    },
    
    getCurrentSelection: function() {
      return this.selections.length > 0 ? this.selections[this.selections.length - 1] : undefined;
    },
    
    showCurrentSelection: function(show) {
      var selection = this.getCurrentSelection();
      if (selection) {
        selection.box[show ? 'fadeIn' : 'fadeOut'](options.selection.fadeDuration);
        selection.startTime.label[show ? 'fadeIn' : 'fadeOut'](options.selection.fadeDuration);
        selection.endTime.label[show ? 'fadeIn' : 'fadeOut'](options.selection.fadeDuration);
        
        this.visibleSelectionsMask |= (1 << selection.id);
      }
    },
    
    showSelectionContainer: function(show) {
      show ? this.source.css({'z-index': options.containerZIndex}) : this.source.css({'z-index': 'auto'});
    },
    
    endSelectionSession: function() {
      $.log('done selecting');
      this.selections = [];
      this.showSelectionContainer(false);
    }
  });
})(jQuery);