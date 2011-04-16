/**
 * This file specifies a few items which need to be available before any other code is loaded.
 */

/**
 * Performs a merge of two objects like jQuery.extend.
 * This will not overwrite any properties in destination and it does not perform a deep merge.
 */
jQuery.safeExtend = function(destination, source) {
  for(key in source)
    if(!destination[key])
      destination[key] = source[key];
};

/**
 * Change the default Prototype extension mechanism to be safeExtend so when Prototype modifies thinks like the Array and Function prototypes, it does not overwrite jQuery.
 */
Object.extend = jQuery.safeExtend;

var Prototype = {
  ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
  JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,  
  
  emptyFunction: function() { },
  K: function(x) { 
    return x 
  }
};

/**
 * Essentially copies an array.
 */
function $A(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}

if (jQuery.browser.safari) {
  $A = function(iterable) {
    if (!iterable) return [];    
    // In Safari, only use the `toArray` method if it's not a NodeList.
    // A NodeList is a function, has an function `item` property, and a numeric
    // `length` property. Adapted from Google Doctype.
    if (!(typeof iterable === 'function' && typeof iterable.length ===
      'number' && typeof iterable.item === 'function') && iterable.toArray)
      return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  };
}

/**
 * Splits a string by whitespace, returning an array of the bits.
 */
function $w(string) {
  if (!Object.isString(string)) return [];
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}