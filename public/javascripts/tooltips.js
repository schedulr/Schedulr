// Class for managing user notifications
var Tooltips = (function($) {
  var options = $.extend(true, {}, $.config.tooltips);
  var id = 0;
  
  var Tooltip = Class.create({
    initialize: function(text, element) {
      $.Views.getAll(this, options.templates);
      this.bindEvents();
    },

    bindEvents: function() {
    }
  });

  // This is a black box popup in the top right corner that goes away in roughly 10 seconds
  var Alert = Class.create({
    initialize: function(text, header, position) {
      $.Views.getAll(this, options.templates);
      
      this.text = text;
      this.header = header;
      this.position = position;
      this.id = ++id;
      
      this.render();
      this.bindEvents();
      this.bindTimeout();
    },
    
    render: function() {
      this.container = $(this.alert.render({text: this.text, header: this.header})).appendTo($('body'));
      this.container.css({
        opacity: 0,
        top: (this.position+100)+'px',
        right: '10px'
      });
      this.updatePosition(undefined, 1000);
    },
    
    updatePosition: function(position, duration) {
      if(position !== undefined) this.position = position;
      
      this.container.stop().animate({
        opacity: 1,
        top: this.position+'px'
      }, duration||500, function() { $(this).css({opacity: 1}) });
    },

    bindEvents: function() {
      $('.closeButton', this.container[0]).click(this.close.wrap(this));
    },
    
    close: function() {
      this.container.fadeOut(function() { $(this).remove(); });
      $.tooltips.close(this);
    },
    
    makeTimeout: function() {
      this.timeout = setTimeout(this.close.wrap(this), 8*1000);
    },
    
    bindTimeout: function() {
      this.makeTimeout();
      $(this.container).mouseenter((function() { clearTimeout(this.timeout); }).bind(this));
      $(this.container).mouseleave(this.makeTimeout.bind(this));
    }
  });

  // This is a black box popup that will not go away until the user clicks the 'x'
  var PermanentAlert = Class.create(Alert, {
    bindTimeout: function() {}
  });

  // This is the Tooltips class
  return Class.create({
    initialize: wrap(function() {
      $.Views.getAll(this, options.templates);
      
      this.alerts = [];
    }),
    
    // Tooltips get stacked below each other if multiple ones need to be displayed at once
    nextPosition: function() {
      var position = options.offset;
      for(var c = 0; c < this.alerts.length; c++) {
        position += this.alerts[c].container.height()+options.spacing;
      }
      return position;
    },
    
    showAlert: function(text, header) {
      this.alerts.push(new Alert(text, header, this.nextPosition()));
    },
    
    showPermanentAlert: function(text, header) {
      this.alerts.push(new PermanentAlert(text, header, this.nextPosition()));
    },
    
    remove: function(header) {
      for(var c = 0; c < this.alerts.length; c++) {
        if(this.alerts[c].header === header) {
          this.alerts[c].close();
          break;
        }
      }
    },
    
    close: function(alert) {
      for(var c = 0; c < this.alerts.length; c++) {
        if(this.alerts[c].id === alert.id) {
          this.alerts.remove(c);
          break;
        }
      }
      
      var position = options.offset;
      for(var c = 0; c < this.alerts.length; c++) {
        this.alerts[c].updatePosition(position);
        position += this.alerts[c].container.height()+options.spacing;
      }
    }
  });
})(jQuery);
jQuery.tooltips = new Tooltips();