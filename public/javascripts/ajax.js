var Ajax = (function($) {
  var _options = $.extend(true, {}, $.config.ajax);

  var Ajax = Class.create({
    initialize: wrap(function(url, options) {
      $.Views.getAll(this, _options.templates);
      
      this.url = url;
      this.options = options;
      
      this.alertOnError = !options.silentErrors;
      this.successCallback = options.success;
      this.scheduleSuccessCallback = options.schedule;
      this.errorCallback = options.error;
      this.params = options.data;
      
      this.makeRequest();
    }),
    
    makeRequest: function() {
      return $.ajax({
        url: this.url,
        data: this.params,
        cache: false,
        dataType: 'xml',
        success: this.onSuccess.wrap(this),
        error: this.onError.wrap(this)
      });
    },
    
    parseResponse: function(response) {
      this.response = response;
      
      this.status = $('status', response).text();
      this.javascript = $('javascript', response).text();
      this.data = $('data', response).text()
      
      if($('loggedIn', response).text() !== 'yes') return this.onLoggedOut();
      
      return true;
    },
    
    onError: function() {
      $.log('ajax error');
      if(this.errorCallback) {
        this.errorCallback();
      } else if(this.alertOnError) {
        $.error(this.errorTemplate.render());
      }
    },
    
    onSuccess: function(response) {
      if(this.parseResponse(response)) {
        if(this.status !== 'success') {
          this.onNotSuccess();
        } else {
          if(this.javascript && this.javascript.length > 0) {
            eval(this.javascript);
          }
          if(this.scheduleSuccessCallback) {
            this.onScheduleSuccess();
          } else if(this.successCallback) {
            this.successCallback(this.data);
          }
        }
      }
    },
    
    onScheduleSuccess: function() {
      $.tooltips.showAlert(this.scheduleSuccessTemplate.render())
    },
    
    onLoggedOut: function() {
      $.error(this.loggedOutTemplate.render());
    },
    
    onNotSuccess: function() {
      $.error(this.notSuccessTemplate.render({status: this.status}));
    }
  });
  
  Ajax.parseArgs = function(args) {
    args = Array.prototype.slice.apply(args);
    var ret = [args.shift()];
    
    if(args.length === 1) {
      if(typeof args[0] === 'function') ret[1] = {success: args[0]};
      else ret[1] = args[0];
    } else if(args.length > 0) {
      var data, success;
      if(typeof args[0] === 'object') {
        data = args.shift();
        
        if(typeof args[0] === 'function') {
          success = args[0];
        } else {
          ret[1] = args[0];
        }
      } else {
        success = args.shift();
        ret[1] = args.shift();
      }
      
      if(ret[1] === undefined) ret[1] = {};
      if(data) ret[1].data = data;
      if(success) ret[1].success = success;
    } else {
      ret[1] = {};
    }
    
    return ret;
  };
  
  Ajax.request = function() {
    var args = Ajax.parseArgs(arguments);
    return new Ajax(args[0], args[1]);
  };
  
  Ajax.silent = function() {
    var args = Ajax.parseArgs(arguments);
    args[1].silentErrors = true;
    return new Ajax(args[0], args[1]);
  };
  
  Ajax.schedule = function(url, options) {
    var args = Ajax.parseArgs(arguments);
    args[1].schedule = true;
    return new Ajax(args[0], args[1]);
  };
  
  return Ajax;
})(jQuery);