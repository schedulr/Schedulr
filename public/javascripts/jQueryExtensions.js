/**
 * These methods are all documented at http://prototypejs.org/api
 */
(function($) {
  jQuery.extend({
    include: function(elems, object) {
      if (Object.isFunction(elems.indexOf))
        if (elems.indexOf(object) != -1)
          return true;
    
      var c = 0, length = elems.length;
      for(; c < length; c++) {
        if(elems[c] == object)
          return true;
      }
      return false;
    },
  
    invoke: function(elems, method) {
      var args = $A(arguments).slice(1);
      return jQuery.map(elems, function(value) {
        return value[method].call(value, args);
      });
    },
    
    partition: function(elems, callback) {
      callback = callback || function(value) { 
        return !!value; 
      }
      var trues = [], falses = [];
      var c = 0, length = elems.length;
      for(; c < length; c++) {
        (callback(elems[c], c) ? trues : falses).push(elems[c]);
      }
      return [trues, falses];
    },
  
    pluck: function(elems, property) {
      var c = 0, length = elems.length, results = [];
      for(; c < length; c++) {
        results.push(elems[c][property]);
      }
      return results;
    }
  });

  Array.from = $A;
  if (!Array.prototype._reverse) Array.prototype._reverse = Array.prototype.reverse;


  function doArrayExtend(baseObject) {
    jQuery.safeExtend(baseObject, {
      include: function( object ) {
        return jQuery.include(this, object);
      },

      invoke: function( callback ) {
        return jQuery.invoke(this, callback);
      },

      partition: function( callback ) {
        return jQuery.partition(this, function(elem, i){
          return callback.call( elem, i, elem );
        });
      },    

      pluck: function( property ) {
        return jQuery.pluck(this, property);
      },
  
      clear: function() {
        this.length = 0;
        return this;
      },
      
      first: function() {
        return this[0];
      },
      
      last: function() {
        return this[this.length - 1];
      },
      
      reverse: function(inline) {
        return (inline !== false ? this : this.toArray())._reverse();
      },
      
      indexOf: function(item, i) {
        i || (i = 0);
        var length = this.length;
        if (i < 0) i = length + i;
        for (; i < length; i++)
          if (this[i] === item) return i;
        return -1;
      },

      lastIndexOf: function(item, i) {
        i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
        var n = this.slice(0, i).reverse().indexOf(item);
        return (n < 0) ? n : i - n - 1;
      },
      
      compact: function() {
        return jQuery.grep(this, function(value) {
          return value != null && value != undefined;
        });
      },
      
      flatten: function() {
        return this.inject([], function(array) {
          return array.concat(Object.isArray(this) ?
            this.flatten() : [this]);
        });
      },
      
      reduce: function() {
        return this.length > 1 ? this : this[0];
      },
      
      clone: function() {
        return [].concat(this);
      },
      
      toJSON: function() {
        var results = [];
        this.each(function(object) {
          var value = Object.toJSON(object);
          if (!Object.isUndefined(value)) results.push(value);
        });
        return '[' + results.join(', ') + ']';
      },
      
      uniq: function() {
        return jQuery.unique(this);    
      }
    });

    if(baseObject == Array.prototype)
      Array.prototype.toArray = Array.prototype.clone;

    if (jQuery.browser.opera){
      Array.prototype.concat = function() {
        var array = [];
        for (var i = 0, length = this.length; i < length; i++) array.push(this[i]);
        for (var i = 0, length = arguments.length; i < length; i++) {
          if (Object.isArray(arguments[i])) {
            for (var j = 0, arrayLength = arguments[i].length; j < arrayLength; j++) 
              array.push(arguments[i][j]);
          } else { 
            array.push(arguments[i]);
          }
        }
        return array;
      };
    }

    jQuery.safeExtend(baseObject, {
      collect: baseObject.map,
      includes: baseObject.include,
      unique: baseObject.uniq
    });
  }

  doArrayExtend(Array.prototype);
  doArrayExtend(jQuery.prototype);
  jQuery.safeExtend(Array.prototype, {
    get: jQuery.prototype.get,
    each: jQuery.prototype.each,
    map: jQuery.prototype.map,
    index: jQuery.prototype.index,
    filter: jQuery.prototype.filter
  });
  
  Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
  };
  
  jQuery.safeExtend(String.prototype, {
    trim: String.prototype.trim || function() {
      var str = this.replace(/^\s\s*/, ''),
      ws = /\s/, i = str.length;
      while (ws.test(str.charAt(--i))) {}
      return str.slice(0, i + 1);
    },

    startsWith: function(pattern, ignoreCase) {
      return ignoreCase ? this.toLowerCase().startsWith(pattern.toLowerCase()) : this.indexOf(pattern) === 0;
    },
    
    endsWith: function(pattern, ignoreCase) {
      if(ignoreCase)
        return this.toLowerCase().endsWith(pattern.toLowerCase());
      var d = this.length - pattern.length;
      return d >= 0 && this.lastIndexOf(pattern) === d;
    },

    toInt: function(base) {
      return parseInt(this, base || 10);
    },
    
    toFloat: function() {
      return parseFloat(this);
    },
    
    shorten: function(max) {
      max = max || 40;
      str = this.replace(/^\s\s*|\s\s*$|\n/g,'');
      return str.length > max ? (str.substring(0, max-1) + '...') : str;
    },
    
    htmlentities: function() {
      return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    
    includes: String.prototype.include
  });
  
  jQuery.extend(Math, {
    /**
    * the standard random method replacement, to make it more useful
    *
    * USE:
    *   Math.random();    // original functionality, returns a float between 0 and 1
    *   Math.random(10);  // returns an integer between 0 and 10
    *   Math.random(1,4); // returns an integer between 1 and 4
    */
    random: function(min, max) {
      var rand = this._random();
      if (arguments.length == 0)
        return rand;
      
      if (arguments.length == 1)
        var max = min, min = 0;
      
      return Math.floor(rand * (max-min+1)+min);
    },
    _random: Math.random
  });
  
  Object.extend(Number.prototype, {
    toColorPart: function() {
      return this.toPaddedString(2, 16);
    },
    
    succ: function() {
      return this + 1;
    },
    
    times: function(iterator, context) {
      return (0).upto(this-1, iterator, context);
    },
    
    upto: function(number, callback, scope) {
      for (var i=this+0; i <= number; i++)
        callback.call(scope, i);
      return this;
    },
    
    downto: function(number, callback, scope) {
      for (var i=this+0; i >= number; i--)
        callback.call(scope, i);
      return this;
    },
    
    toPaddedString: function(length, radix) {
      var string = this.toString(radix || 10);
      return '0'.times(length - string.length) + string;
    },
    
    toJSON: function() {
      return isFinite(this) ? this.toString() : 'null';
    },
    
    toOrdinal: function() {
      switch(this+0) {
        case 1: return "first";
        case 2: return "second";
        case 3: return "third";
        case 4: return "fourth";
        case 5: return "fifth";
        case 6: return "sixth";
        case 7: return "seventh";
        case 8: return "eighth";
      }
    }
  });
    
  $w('abs round ceil floor').each(function(){
    var method = this;
    Number.prototype[method] = Math[method].methodize();
  });
})(jQuery);
