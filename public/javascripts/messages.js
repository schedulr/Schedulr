(function($) {
  /**
   * Causes the current element to fly down from the top of the screen and bounce a little in the middle.
   */
  $.fn.bounce = function(x, y) {
    var height = $(this).height();
    $(this).css({'top': "-"+height+"px", 'left': x+'px'}).
      stop().
      animate({top: (y+70)+'px'}, 100).
      animate({top:"-=140px"}, 100).
      animate({top:"+=100px"}, 100).
      animate({top:"-=60px"}, 100).
      animate({top:"+=40px"}, 100).
      animate({top:"-=20px"}, 100).
      animate({top:"+=15px"}, 100).
      animate({top:"-=5px"}, 100);
  };


  /**
   * Returns an object with properties x and y denoting the x/y location of the element that would put it in the center of the screen.
   */
  $.fn.center = function() {
    var width = this.width(), height = this.height();
    var bodyWidth = $(window).width(), bodyHeight = $(window).height();
    var x = (bodyWidth/2) - (width / 2), y = (bodyHeight/2) - (height / 2);
    if(x < 0) x = 0;
    if(y < 0) y = 0;
    return {x: x, y: y};
  };

  /**
   * Shows an error message.
   */
  $.error = wrap(function(message) {
    return $.messageString('Error', message, undefined, true);
  });
  
  $.messageView = function(title, view, data, classes) {
    return new Dialog(view.render.bind(view, data), title, classes);
  };
  
  $.messageString = function(title, str, classes, blackbox) {
    return new Dialog(function() { return str; }, title, classes, undefined, undefined, blackbox);
  };

  /**
   * Creates a small popup menu for use in the schedule and fades it in.
   */
  $.fn.createPopup = function(items, css, template) {
    parent = $(this);
    if(parent.data) {
      if(parent.data('popupMenuShowing'))
        return;
      parent.data('popupMenuShowing', true);
    }
    
    var html = template.render({items: items});
    var node = $(html);
    node.hide().appendTo($('body'));
    node.css(css).fadeIn('fast');
    
    $('a', node).click(function(event) {
      event.preventDefault();
      var $this = $(this);
      for(var c = 0; c < items.length; c++) {
        if(items[c].text === $this.text()) {
          items[c].callback();
        }
      }
    });

    //to hide the menu, we want a small delay in case they move their mouse out accidently or something
    //outTime will be a short timer.  When it goes off, the menu will hide.
    //Every time the mouse enters the table cell or popup menu, the timer is reset.
    var outTimer = null;
    var mouseenterFunction = function() {
      if(outTimer !== null) {
        clearTimeout(outTimer);
        outTimer = null;
      }
    };
    var mouseleaveFunction = function() {
      outTimer = setTimeout(function() {
        parent.data('popupMenuShowing', false);
        node.fadeOut('fast').remove();
      }, 0);
    };
    
    node.mouseenter(mouseenterFunction).mouseleave(mouseleaveFunction);
    if(parent.mouseenter) parent.mouseenter(mouseenterFunction).mouseleave(mouseleaveFunction);
  };
})(jQuery);

/**
 * Base class for showing popup messages.
 * Accepts a function as the first parameter which will be called to get the content of the message box
 * classes is a string of CSS classes to be added to the .messageBox div
 * buttons is a dictionary of button label -> callback functions for the message box
 * if no buttons are provided, a Close button is used as a default
 * blackout is a boolean to fade the background of the page to black while the popup is shown
 */
var Dialog = (function($) {
  return Class.create({
    initialize: wrap(function(getHtml, title, classes, onClose, buttons, blackout) {
      this.createAndShow(getHtml, title, classes, onClose, buttons, blackout);
    }),
    
    createAndShow: wrap(function(getHtml, title, classes, onClose, buttons, blackout) {
      this.getHtml = getHtml;
      this.title = title;
      this.classes = classes;
      this.onClose = onClose;
      this.buttons = buttons;
      this.blackout = blackout;
      this.createDialog();
      this.show();
    }),
    
    createDialog: function() {
      if(!this.buttons) this.buttons = {'Close': undefined};
      
      this.dialogTemplate = $.Views.get($.config.dialogTemplate);
      
      this.shadow = $($.shadowTemplate.render()).appendTo($('#content'));
      this.shadow.wrap("<div class='messageBox "+(this.boxClass || "")+"'></div>");
      this.shadow = this.shadow.parent().hide();
      this.container = this.shadow.find('.dropShadowContent');
      this.container.append(this.dialogTemplate.render({dialog: this}));
      
      this.contentContainer = this.container.find('.messageBoxContent');
      this.render();
  
      this.container.delegate('.closeButton', 'click', this.close.wrap(this));
      this.container.delegate('.messageBoxButton', 'click', this.buttonClicked.wrapEvent(this));
    },
    
    buttonClicked: function(button) {
      if(this.buttons[button.val()]) {
        this.buttons[button.val()]();
      }
      this.close(button.val());
    },
    
    show: function() {
      if(this.blackout) {
        if(Dialog.count === 0) {
          $("#blackBox").stop().show().css({opacity: 0.7});
        }
        Dialog.count += 1;
      }
      this.shadow.show();
      var pos = this.shadow.center();
      this.shadow.bounce(pos.x, pos.y);
    },
    
    render: function() {
      this.contentContainer.html(this.getHtml());
    },

    close: function() {
      this.shadow.fadeOut(this.shadow.remove.bind(this.shadow));
      if(this.blackout) {
        Dialog.count -= 1;
        if(Dialog.count === 0) $("#blackBox").fadeOut($.fn.hide.bind($("#blackBox")));
      }
      if(this.onClose) {
        this.onClose();
      }
    }
  });
})(jQuery);
Dialog.count = 0;