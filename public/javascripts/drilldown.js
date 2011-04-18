/**
 * The drillDown is a tool for rapidly filtering large sets of data.
 * The drillDown functions similarly to an ipod style drilldown menu, except rather than showing one menu at a time, it will show all of them.
 * The drillDown uses callback functions to generate its data.
 * Each function should accept the object that is currently selected, and it must return a new object, which is stored in the panels array.
 * They values of the object are:
 *   items: an array of the items to show in the next panel.  It may be a good idea to clone this array, as the drillDown will modify it.
 *   textKey: an optional element used to extract a single element from every object for displaying it.
 *   final: a boolean indicating whether the next panel should show the details panel
 *   callback: a function that returns the data for the next panel
 *   filters: a list of filter functions
 * The filter functions are a powerful tool for removing unneccessary data.
 * Each of the filter functions will be called once for each object in a panel, each time a panel is rendered.
 * If any of the filters return false, that object is not displayed.
 */
(function($) {
  $.fn.drillDown = wrap(function(data, callback, o) {
    var options = $.extend(true, {}, $.config.drillDown, o);
    
    var DrillDown = Class.create({
      initialize: function(container, data, callback) {
        this.container = container;
        this.callback = callback;
        
        $.Views.getAll(this, options.templates);
        
        this.dropShadow = $($.shadowTemplate.render()).appendTo(container);
        this.dropShadowCenter = $('.dropShadowContent', this.dropShadow);
        this.dropShadowContent = $('<div></div>').appendTo(this.dropShadowCenter);
        
        this.panels = [data];
        this.createNewPanel(0, 0);
        
        $('div.drillDownPanelContainer li', $("div.drillDownContainer")[0]).
          live("mouseenter", this.onMouseEnter.wrapEvent(this)).
          live("mouseleave", this.onMouseLeave.wrapEvent(this)).
          live("click", this.onClick.wrapEvent(this));
          
        $(document).keydown(this.onKeyDown.wrap(this));
        
        //this.setupSearch();
      },

      /**
       * Creates the html for a panel and binds the events to the panel.
       * It returns the created html node.
       */
      createPanelContent: function(panelIndex) {
        var panel = this.panels[panelIndex];
        
        if(panel.details) {
          return $(this.detailsPanel.render($.extend({index: panelIndex}, panel)));
        } else {
          var items = panel.textKey ? panel.items.pluck(panel.textKey) : panel.items;
          var filteredItems = panel.filteredItems || [];
          filteredItems = panel.textKey ? filteredItems.pluck(panel.textKey) : filteredItems;
          var classes = panel.classCallback ? $.map(panel.items, panel.classCallback) : [];
          return $(this.panel.render({items: items, index: panelIndex, filteredItems: filteredItems, classes: classes}));
        }
      },

      /**
       * This function creates and animates a new panel.
       */
      createNewPanel: function(panelIndex) {
        //these are positioned relative to the top left of the table, so they must be offset 11 for the drop shadow
        //to avoid double borders, each must be placed an additional one pixel to the right
        var x = (this.panels.length-1) * (options.panelWidth+1)+11;
        var container = $('<div class="drillDownPanelContainer"></div>').append(this.createPanelContent(panelIndex));
        if(this.panels[panelIndex].details) container.addClass("drillDownPanelDetailsContainer");
        
        this.panels[panelIndex].panel = container;
        this.container.append(container);
        
        container.css({
          opacity: 0,
          left: x-options.panelWidth,
          zIndex: options.maxZIndex-this.panels.length
        }).animate({
          left: x,
          opacity: 1
        }, 'fast');
        this.resizeDropShadow();
      },

      /**
       * Updates one panel with new html.
       * If panels 1 and 2 are open and the user mouses over panel 1, the html in 2 must change, but no animation is required,
       * because it is already open.
       */
      updateExistingPanel: function(panelIndex) {
        this.panels[panelIndex].panel.empty().append(this.createPanelContent(panelIndex)).scrollTop(0);
      },
      
      /**
       * Closes the panels upto, but not including the panel at index depth.
       * When the user hovers over the first panel after more than two have been opened, some of the panels need to slide left and be removed
       */
      hideOpenPanels: function(depth) {
        //x is the location to which the panel must fly in order to be hidden
        var x = (depth-1)*options.panelWidth;
        for(var c = depth+1; c < this.panels.length; c++) {
          if(this.panels[c].panel) {
            this.panels[c].panel.animate({
              left: x,
              opacity: 0
            }, 'fast', function() { $(this).remove(); });
          }
        }

        //the animation will not have finished at this point, but the pointers to the panels can be removed
        this.panels.remove(depth+1, -1);
        this.resizeDropShadow();
      },

      /**
       * The drop shadow will not automatically resize because the panels are positioned absolutely.
       * This function manually animates the size of the dropdown.
       */
      resizeDropShadow: function() {
        // the shadows are 11 wide, but the images are 14 wide to give it some padding.
        // this means the width should be shrunk by 6 so there is no white spacing
        // additionally, we have to add the extra pixel per panel that is added to avoid double borders
        var width = ((this.panels.length)*options.panelWidth+this.panels.length-6);
        if(this.panels[this.panels.length-1].details) width += options.detailsPanelWidth - options.panelWidth;
        this.dropShadowContent.css({display: 'inline-block', width: width});
      },
      
      /**
       * Single function for accessing panel data by liTag or by index
       */
      retrievePanel: function() {
        var data = {};
        if(arguments.length === 1) {
          data.liTag = arguments[0];
          data.aTag = data.liTag.find('a');
          
          var bits = data.aTag.attr('id').split('-');
          data.prefix = bits[0];
          data.panelIndex = parseInt(bits[1], 10);
          data.itemIndex = parseInt(bits[2], 10);
          data.filtered = data.liTag.hasClass('filteredItem');
        } else {
          data.panelIndex = arguments[0];
          data.itemIndex = arguments[1];
          data.filtered = arguments[2]===true;
          data.prefix = "ddr"+(data.filtered ? 'f' : '');
          data.aTag = $("#"+data.prefix+"-"+data.panelIndex+"-"+data.itemIndex);
          data.liTag = data.aTag.parent();
        }
        
        if(data.liTag.hasClass('itemsRemoved')) return;
        
        data.panel = this.panels[data.panelIndex];
        if(!data.panel || !data.panel.items) return data;
        
        data.item = data.filtered ? data.panel.filteredItems[data.itemIndex] : data.panel.items[data.itemIndex];
        return data;
      },
      
      onMouseEnter: function(element) {
        $('.keyboardRow').removeClass('keyboardRow');
        this.lastEnter = element;
        if(this.enterTimeout) clearTimeout(this.enterTimeout);
        this.enterTimeout = setTimeout(this.processMouseEnter.wrap(this, element), 250);
      },
      
      onMouseLeave: function(element) {
        if(this.lastEnter && this.lastEnter[0] === element[0]) {
          this.lastEnter = undefined;
          if(this.enterTimeout) clearTimeout(this.enterTimeout);
        }
      },

      processMouseEnter: function(liTag) {
        var data = this.retrievePanel(liTag);
        if(data && data.prefix !== 'ddrDetailsLink') this.openPanel(data);
      },
      
      onKeyDown: function(event) {
        switch(event.which) {
          case 37:
          case 39:
          case 38:
          case 40:
          case 32:
          case 13:
            break;
          default:
            return;
        }
        
        event.preventDefault();
        var keyboardRow = $('.keyboardRow');
        if(keyboardRow.length === 0) {
          this.addKeyboardClass(0);
          return false;
        }
        
        var data = this.retrievePanel(keyboardRow);
        switch(event.which) {
          case 37:
            this.openHorizontalArrow(data, data.panelIndex-1);
            break;
          case 39:
            this.openHorizontalArrow(data, data.panelIndex+1);
            break;
          case 38:
            this.openVerticalArrow(data, data.itemIndex-1);
            break;
          case 40:
            this.openVerticalArrow(data, data.itemIndex+1);
            break;
          case 32:
          case 13:
            this.onClick(keyboardRow);
            break;
        }
        
        return false;
      },

      onClick: function(liTag, event) {
        if(event) event.stopPropagation();
        
        var data = this.retrievePanel(liTag);
        if(!data || !data.panel) return;
        
        if(data.prefix === 'ddrDetailsLink') {
          var link = data.panel.links[data.itemIndex];
          if(link.callback) link.callback(data.panel.item);
        } else {
          this.callback(data.item);
        }
      },
      
      addKeyboardClass: function(index, row) {
        if(row === undefined || row.length === 0) {
          if(this.panels[index].details) {
            row = $('#ddrDetailsLink-'+index+'-0').closest('li');
          } else if(this.panels[index].items === undefined || this.panels[index].items.length === 0) {
            row = $('#ddrf-'+index+'-0').closest('li');
          } else {
            row = $('#ddr-'+index+'-0').closest('li');
          }
          
          var parent = row.closest('.drillDownPanelContainer');
          var tmp = parent.find('.activeRow');
          if(tmp.length > 0) row = tmp;
        }
        
        row.addClass('keyboardRow');
        
        var parent = row.closest('.drillDownPanelContainer');
        var height = parent.height();
        var scrollTop = parent.scrollTop();
        var offset = row.offset().top - parent.offset().top;
        
        if(offset < 1) {
          parent.scrollTop(scrollTop + offset - 1);
        } else if(offset > height) {
          parent.scrollTop(offset - height + row.height() + scrollTop);
        }
        
        var data = this.retrievePanel(row);
        this.openRow(data.panelIndex, data.itemIndex, data.filtered);
      },
      
      // Handles a left or right arrow key
      openHorizontalArrow: function(data, index) {
        if(index < 0 || index >= this.panels.length) return;
        
        var panel = this.panels[index];
        if(panel === undefined) return;
        
        data.liTag.removeClass('keyboardRow');
        this.addKeyboardClass(index);
      },
      
      // Handles an up or down arrow key
      // This function attempts to wrap the keyboard event between the .items and .filteredItems data
      // It must handle cases when one or both are not defined or are empty
      openVerticalArrow: function(data, index) {
        var panel = data.panel;
        if(panel === undefined) return;
        
        var row;
        if(panel.details) {
          if(panel.links) {
            if(index < 0) index = panel.links.length - 1;
            else if(index > panel.links.length) index = 0;
            row = $('#ddrDetailsLink-'+index+'-0').closest('li');
          }
        } else {
          if(index < 0) {
            if(data.filtered && panel.items !== undefined && panel.items.length > 0) {
              index = panel.items.length-1;
              data.filtered = false;
            } else if(!data.filtered && panel.filteredItems !== undefined && panel.filteredItems.length > 0) {
              index = panel.filteredItems.length-1;
              data.filtered = true;
            } else {
              index = 0;
            }
          }
          
          if(data.filtered && index >= panel.filteredItems.length && panel.items !== undefined) {
            data.filtered = false;
            index = 0;
          } else if(!data.filtered && index >= panel.items.length && panel.filteredItems !== undefined) {
            data.filtered = true;
            index = 0;
          }
          
          row = $('#ddr'+(data.filtered ? 'f' : '')+'-'+data.panelIndex+'-'+index).closest('li');
        }
        
        data.liTag.removeClass('keyboardRow');
        this.addKeyboardClass(data.panelIndex, row);
      },
      
      openRow: wrap(function(panelIndex, itemIndex, filtered) {
        this.attempt = [panelIndex, itemIndex, filtered];
        this.openPanel(this.retrievePanel(panelIndex, itemIndex, filtered));
      }),
      
      openPanel: function(data) {
        if(!data || !data.panel || !data.item) return;
        var panel = data.panel, item = data.item, newPanel;
        
        if(panel.activeRow) panel.activeRow.removeClass('activeRow');
        panel.activeRow = data.liTag.addClass('activeRow');
        
        //if the item was given a specific callback function for its children, then it should be used, otherwise, use the default one for the panel
        if(item.callback) newPanel = item.callback(item);
        else if(panel.callback) newPanel = panel.callback(item);
        else return;
      
        //run each of the filters, removing any items that do not pass every filter
        if(newPanel.filters && newPanel.items) {
          var filteredItems = [];
          for(var c = 0; c < newPanel.filters.length; c++) {
            var items = [], filter = newPanel.filters[c];
            for(var d = 0; d < newPanel.items.length; d++) {
              if(filter(newPanel.items[d], d)) {
                items.push(newPanel.items[d]);
              } else {
                filteredItems.push(newPanel.items[d]);
              }
            }
            newPanel.items = items;
          }
          newPanel.filteredItems = filteredItems;
        }
           
        //check if a new panel needs to be created
        if(data.panelIndex < this.panels.length-1) {
          var originalPanel = this.panels[data.panelIndex+1];
          if(originalPanel.panel === undefined) {
            this.hideOpenPanels(data.panelIndex+1);
            this.panels.push(newPanel);
            this.createNewPanel(data.panelIndex+1);
          } else {
            $.extend(originalPanel, newPanel);
            
            // Since we copied the panel, need to clear out values not in the new panel
            if(!('textKey' in newPanel)) delete originalPanel.textKey;
            if(!('callback' in newPanel)) delete originalPanel.callback;
            if(!('filters' in newPanel)) delete originalPanel.filters;
            if(!('classCallback' in newPanel)) delete originalPanel.classCallback;
            if(!('filteredItems' in newPanel)) delete originalPanel.filteredItems;
            if(!('items' in newPanel)) delete originalPanel.filteredItems;
              
            this.updateExistingPanel(data.panelIndex+1);
            this.hideOpenPanels(data.panelIndex+1);
          }
        } else {
          this.panels.push(newPanel);
          this.createNewPanel(data.panelIndex+1);
        }
        
        // If the next panel has 1 item, open it
        if(newPanel.items && newPanel.items.length === 1) {
          setTimeout(this.openRow.bind(this, data.panelIndex+1, 0), 0);
        }
      }
    });
    return new DrillDown($(this), data, callback);
  });
})(jQuery);