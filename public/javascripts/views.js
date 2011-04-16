/**
 * This is a simple set of functions for managing haml views throughout an app.
 * It maintains a cache of all of the views so that only one instance of a view exists in memory.
 * If a view is requested, but not available, it will make an ajax request to load the view.
 * There are two important settings, viewsRoot, and viewsExtension which are strings that are added to the beginning/end of any view path.
 * This is an extensible interface, as the viewType can be any javascript class which implements a compile and render method.
 */

(function($) {
  var defaults = {
    root: '/views/',
    extension: '.haml',
    viewType: HamlView
  };
  var options = $.extend(true, {}, defaults, ($.viewDefaults || {}), $.config.views);
  
  /**
   * Takes a view object or string, renders it, and replaces the html of the current node with the html from the view.
   */
  $.fn.render = function(view, data) {
    view = $.Views.get(view);
    if(view) this.html(view.render(data));
  };
  
  $.Views = {
    views: {},
    viewsRoot: options.root,
    viewsExtension: options.extension,
    viewType: options.viewType,

    /**
     * Cruedly attempts to join two paths together properly such as:
     * test/directory/  /path/to/view
     * becomes:
     * test/directory/path/to/view
     */
    join: function(left, right) {
      left = left.trim();
      right = right.trim();

      if(left.length == 0) {
        return right;
      }
      if(right.length == 0) {
        return left;
      }
          
      if(left.endsWith("/")) {
        left = left.substring(0, left.length-1);
      }
      if(right.startsWith("/")) {
        right = right.substring(1);
      }
      
      return left+"/"+right;
    },

    /**
     * Returns a view object for the specified view path.
     */
    get: function(view, prefix) {
      //check if they are passing a view object
      if(view instanceof this.viewType) {
        return view;
      }
      
      //check the cache
      if(this.views[view] !== undefined) {
        return this.views[view];
      }
      
      //if it is not an absolute path and a prefix is set, use it
      if(!view.startsWith('/') && prefix) {
        view = this.join(prefix, view);
      
        //check the cache again
        if(this.views[view] !== undefined) {
          return this.views[view];
        }
      }
        
      this.load(view);
      return this.views[view];
    },
      
    /**
     * Loads each of the views in views as an instance variable in obj.
     * Views is an object, the keys will be the names of the instance variables, and the values are the paths to the views.
     */
    getAll: function(obj, views) {
      var root = views.root || '';
      for(var key in views) {
        if(key == 'root')
          continue;
        obj[key] = this.get(views[key], root);
      }
    },

    /**
     * Uses a true ajax request to load a view.
     */
    preload: function() {
      for(var view in arguments) {
        this.load(view, true);
      }
    },

    /**
     * Makes an ajax request to load a view at the specified path.
     */
    load: function(view, asynchronous) {
      var viewUrl = this.join(this.viewsRoot, view)+this.viewsExtension, t=this;
      $.ajax({
        url: viewUrl,
        error: function(xmlHttpRequest, errorMessage, error) {
        }, success: function(data, status) {
          t.add(view, data);
        },
        async: (asynchronous || false)
      });
    },

    /**
     * Creates a new view object for the given view text.
     */
    add: function(view, data) {
      return this.views[view] = new this.viewType(view, data);
    },

    /**
     * Renders the given view.
     */
    render: function(view, data) {
      view = this.get(view);
      return view.render(data);
    }
  };
})(jQuery);