/**
 * This class is used for showing a help window when the page first loads and if the user clicks a help link.
 * It will set a cookie so the help window only shows on their first trip to the page.
 */
 
var HelpSystem = (function($) {
  var options = $.extend(true, {}, $.config.help);

  return Class.create({
    initialize: function(helpLinks) {
      $.Views.getAll(this, options.templates);
       setTimeout(this.checkHelp.wrap(this), 100);
    },
    
    checkHelp: function() {
      if(state.version < $.config.currentVersion) {
        this.showHelp();
      }
    },
    
    showHelp: function() {
      var title = state.version === 0 ? 'Welcome to a Better Course Schedulr!' : 'See What\'s New';
      new Dialog(this.helpTemplate.render.bind(this.helpTemplate), title, 'helpBox');
      Ajax.silent(options.urls.version, {data: {version: $.config.currentVersion}});
      state.version = $.config.currentVersion;
    }
  });
})(jQuery);