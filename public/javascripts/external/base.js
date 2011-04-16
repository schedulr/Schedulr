/**
 * Modified subset of prototypejs library.
 */
 /* Based on Alex Arnell's inheritance implementation. */
var Class = {
  create: function() {
    var parent = null, properties = $A(arguments);
    if (Object.isFunction(properties[0]))
      parent = properties.shift();
    
    function klass() {
      this.initialize.apply(this, arguments);
    }
    
    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];
    
    if (parent) {
      var subclass = function() { };
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }
    
    for (var i = 0; i < properties.length; i++)
      klass.addMethods(properties[i]);
      
    if (!klass.prototype.initialize)
      klass.prototype.initialize = Prototype.emptyFunction;
    
    klass.prototype.constructor = klass;
    
    return klass;
  }
};

Class.Methods = {
  addMethods: function(source) {
    var ancestor   = this.superclass && this.superclass.prototype;
    var properties = Object.keys(source);
    
    if (!Object.keys({ toString: true }).length)
      properties.push("toString", "valueOf");
    
    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames().first() == "$super") {
        var method = value;
        value = (function(m) {
          return function() { return ancestor[m].apply(this, arguments) };
        })(property).wrap(method);

        value.valueOf = method.valueOf.bind(method);
        value.toString = method.toString.bind(method);
      }
      this.prototype[property] = value;
    }
    
    return this;
  }
};

var Abstract = { };

jQuery.safeExtend(Array.prototype, {
  toJSON: function() {
    var results = [];
    for(var c = 0; c < this.length; c++) {
      var value = Object.toJSON(this[c]);
      if (!Object.isUndefined(value)) results.push(value);
    }
    return '[' + results.join(', ') + ']';
  } 
});
jQuery.extend(String.prototype, {
  toJSON: function() {
    var escapedString = this.replace(/[\x00-\x1f\\]/g, function(character) {
      if (character in String.specialChar) {
        return String.specialChar[character];
      }
      return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
    });
    return '"' + escapedString.replace(/"/g, '\\"') + '"';
  } 
});

jQuery.safeExtend(Object, {
  toJSON: function(object) {
    var type = typeof object;
    switch (type) {
      case 'undefined':
      case 'function':
      case 'unknown': return;
      case 'boolean': return object.toString();
    }

    if (object === null) return 'null';
    if (object.toJSON) return object.toJSON();
    if (Object.isElement(object)) return;

    var results = [];
    for (var property in object) {
      var value = Object.toJSON(object[property]);
      if (!Object.isUndefined(value))
        results.push(property + ': ' + value);
    }

    return '{' + results.join(', ') + '}';
  },
  
  keys: function(object) {
    var keys = [];
    for (var property in object)
      keys.push(property);
    return keys;
  },
  
  values: function(object) {
    var values = [];
    for (var property in object)
      values.push(object[property]);
    return values;
  },
  
  clone: function(object) {
    return Object.extend({ }, object);
  },
  
  isElement: function(object) {
    return !!(object && object.nodeType == 1);
  },
  
  isArray: function(object) {
    return object != null && typeof object == "object" &&
      'splice' in object && 'join' in object;
  },
  
  isFunction: function(object) {
    return typeof object == "function";
  },
  
  isString: function(object) {
    return typeof object == "string";
  },
  
  isNumber: function(object) {
    return typeof object == "number";
  },
  
  isUndefined: function(object) {
    return typeof object == "undefined";
  },
  
  empty: function(object) {
  	return !(object !== undefined && object !== null && object.length && object.length > 0);
  }
});

Object.extend(Function.prototype, {
  argumentNames: function() {
    var names = this.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/)[1]
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  },
  
  bind: function() {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = $A(arguments), object = args.shift();
    return function() {
      return __method.apply(object, args.concat($A(arguments)));
    }
  },
  
  bindEvent: function() {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = $A(arguments), object = args.shift();
    return function() {
      return __method.apply(object, [$(this)].concat(args.concat($A(arguments))));
    }
  },
  
  bindAsEventListener: function() {
    var __method = this, args = $A(arguments), object = args.shift();
    return function(event) {
      return __method.apply(object, [event || window.event].concat(args));
    }
  },
  
  curry: function() {
    if (!arguments.length) return this;
    var __method = this, args = $A(arguments);
    return function() {
      return __method.apply(this, args.concat($A(arguments)));
    }
  },

  delay: function() { 
    var __method = this, args = $A(arguments), timeout = args.shift() * 1000; 
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
  },
  
  defer: function() {
    var args = [0.01].concat($A(arguments));
    return this.delay.apply(this, args);
  },
  
  wrap: function(wrapper) {
    var __method = this;
    return function() {
      return wrapper.apply(this, [__method.bind(this)].concat($A(arguments))); 
    }
  },
  
  methodize: function() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      return __method.apply(null, [this].concat($A(arguments)));
    };
  }
});

RegExp.prototype.match = RegExp.prototype.test;

RegExp.escape = function(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
