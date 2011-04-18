var HamlView = (function ($) {
  var undefined, options = {
    xhtml: true
  };
  
  var node = $("<div></div>");
  
  window.h = function(str) {
    return node.text(str).html().replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
  };
  
  var haml = function(name, view) {
    this.name = name;
    this.text = view;
  };
  
  $.extend(haml, {
    regex: {
      interpolation: /(^|.|\r|\n)(#\{(.*?)\})/,
      simpleInterpolation: /#\{(.*?)\}/g,
      // first group: %tag.class or .class
      // second group is the only characters that can immediately follow a tag
      // second group: the stuff after a tag
      tag: /^((?:%[a-z0-9_:\-$]+(?:[.#][a-z0-9_:\-$]+)*)|(?:(?:[.#][a-z0-9_:\-$]+)+))(.*)$/i,
      cssClass: /\.([a-z0-9_:\-$]+)/gi,
      id: /#([a-z0-9_:\-$]+)/gi,
      tagName: /%([a-z0-9_:\-$]+)/i,
      blankLine: /^\s*$/,
      lineWhitespace: /^(\s+)(.*)$/,
      onlySpace: /^[ ]+$/,
      onlyTab: /^\t+$/,
      multilineRuby: /(.*)\|\s*$/,
      // matches a key in an json or ruby hash
      lvalue: /^\s*\:?['"a-z0-9_\-$]+\s*(\:|=>)/i,
      attributeName: /^\s*["':]\s*([a-z0-9_$\-:]+)\s*["']?/i,
      // matches an attributes that hash that only contains a variable in it
      attributesVariable: /^\s*([a-z0-9_\-$]+)\s*$/i,
      // match a keyword, followed by the end of line or (a space or paren and then the rest of the string)
      autoBracket: /^\s*(for|switch|while|else\s+if|if|else)(?:$|((?:\s|\().*)$)/,
      // matches for c in 0..10
      forIn: /^\s*([a-z0-9_$\-]+)\s+in\s+(.+)\.\.(.+)/i,
      // match for item in array using c
      forInArray: /^\s*([a-z0-9_$\-]+)\s+in\s+([^}]+)/i,
      forInUsing: /\s+using\s+([a-z0-9_$\-]+)/i
    },
    
    autocloseTags: {'img': true, 'br': true, 'hr': true, 'input': true, 'meta': true, 'link': true},
    multilineStopCharacters: {'.': true, '#': true, '%': true, '=': true, '-': true},
    
    errors: {
      mixedIndentation: "Found tabs and spaces mixed at the beginning of a line.",
      unevenSpacing: "Found an uneven amount of space at the beginning of a line.",
      indentationFirstLine: "Found whitespace on the first line of content."
    }
  });
  
  var Buffer = makeClass(null, {
    initialize: function() {
      this.buffer = [];
      this.strings = [];
    },
    
    code: function() {
      this.clearStrings();
      Array.prototype.push.apply(this.buffer, arguments);
    },
    
    output: function() {
      this.clearStrings();
      var buffer = this.buffer;
      $.each(arguments, function(ix, arg) {buffer.push('__o.push(', arg, ');\n')});
    },
    
    string: function() {
      Array.prototype.push.apply(this.strings, arguments);
    },
    
    interpolatedString: function() {
      var text, match, beforeMatch;
      for(var c = 0; c < arguments.length; c++) {
        text = arguments[c];
        //most of this comes from prototype's gsub method
        while (text.length > 0) {
          match = text.match(haml.regex.interpolation);
          if (match !== null) {
            beforeMatch = text.slice(0, match.index);
            text = text.slice(match.index + match[0].length);
            
            //check if the text is proceeded by a backslash
            if (match[1] && match[1] === '\\') {
              //the backslash will be caught in the string that comes before the match, so we need to remove the last character
              this.string(beforeMatch, match[2]);
            } else {
              this.string(beforeMatch, match[1]);
              this.output(match[2].substring(2, match[2].length-1));
            }
          } else { //if there was no match, or we are at the end, then just add the remaining text
            this.string(text);
            text = '';
          }
        }
      }
    },
    
    clearStrings: function() {
      if(this.strings.length === 0) return;
      
      var str = this.strings.join('');
      this.strings.length = 0;
      this.buffer.push('__o.push("', sanitize(str), '");\n');
    }
  });
  
  var Term = makeClass(null, {
    initialize: function(parent, data) {
      this.data = data;
      this.attach(parent);
    },
    
    attach: function(parent) {
      this.parent = parent;
      
      if(parent) {
        this.view = parent.view;
        parent.children.push(this);
      }
      
      this.children = []
    },
    
    toJs: function(output) {
      this.processChildren(output);
    },
    
    processChildren: function(output) {
      for(var c = 0; c < this.children.length; c++) {
        this.children[c].toJs(output);
      }
    }
  });
  
  var Root = makeClass(Term, {
    toJs: function() {
      var output = new Buffer();;
      this.processChildren(output);
      output.clearStrings();
      return output.buffer.join('');
    }
  });
  
  var HamlString = makeClass(Term, {
    toJs: function(output) {
      output.string(this.data);
    }
  });
  
  var HamlInterpolatedString = makeClass(Term, {
    toJs: function(output) {
      output.interpolatedString(this.data);
    }
  });
  
  var CodeOutput = makeClass(Term, {
    initialize: function(parent, data) {
      this.data = data.join('');
      
      if(this.data.charAt(0) === '=') return new HamlInterpolatedString(parent, ltrim(this.data.substring(1)));
      this.attach(parent);
    },
    
    toJs: function(output) {
      output.output(this.data);
    }
  });
  
  var Code = makeClass(Term, {
    initialize: function(parent, data) {
      data = data.join('');
      var match = haml.regex.autoBracket.exec(data);
      if(match !== null) {
        haml.expression = new WrappedCode(parent, data, match[1], match[2]);
        return;
      }
      
      this.data = data;
      this.canIndent = true;
      this.attach(parent);
    },
    
    toJs: function(output) {
      output.code(this.data);
      this.processChildren(output);
    }
  });
  
  var WrappedCode = makeClass(Term, {
    initialize: function(parent, data, keyword, body) {
      this.data = data;
      this.keyword = keyword;
      this.canIndent = true;
      this.attach(parent);
      
      body = body || '';
      var idx = body.indexOf("{");
      if(idx >= 0) {
        this.body = body.substring(idx);
        this.condition = body.substring(0, idx-1);
      } else {
        this.body = '';
        this.condition = body;
      }
      
      // remove parentheses wrapping the if/for statement
      this.condition = ltrim(this.condition);
      idx = findEnd(this.condition, ')', 1);
      if(idx >= 0 && idx < this.condition.length) {
        this.body = this.condition.substring(idx+1)+this.body;
        this.condition = this.condition.substring(this.condition.indexOf('(')+1, idx);
      }
      
      // detect special for loops
      this.forLoop();
    },
    
    forLoop: function() {
      var match = haml.regex.forIn.exec(this.condition);
      if(match !== null) {
        this.condition = $t("var #{name} = #{start}; #{name} < #{end}; #{name}++", {name: match[1], start: match[2], end: match[3]});
      } else {
        match = haml.regex.forInArray.exec(this.condition);
        if(match === null) return;
        var count = ++WrappedCode.count;
        
        var arrayValue = match[2];
        var counterName = "forEachCounter"+count;
        var itemName = match[1];
        
        match = haml.regex.forInUsing.exec(arrayValue);
        if(match !== null) {
          arrayValue = arrayValue.substring(0, match.index);
          counterName = match[1];
        }
        
        this.condition = $t("var #{arrayName} = #{arrayValue}, #{lengthName} = #{arrayName}.length, #{counterName} = 0, #{itemName} = #{arrayName}[0]; "+
          "#{counterName} < #{lengthName}; " +
          "#{itemName} = #{arrayName}[++#{counterName}]", {
            lengthName: "forEachLength"+count,
            arrayName: "forEachArray"+count,
            arrayValue: arrayValue, itemName: itemName, counterName: counterName
          }
        );
      }
    },
    
    toJs: function(output) {
      if(this.keyword === 'else') output.code('else {\n');
      else output.code(this.keyword, '(', this.condition, ')', '{\n');
        output.code(this.body);
        this.processChildren(output);
      output.code('}\n');
    }
  });
  WrappedCode.count = 0;
  
  var Defaults = makeClass(Term, {
    toJs: function(output) {
      this.view.defaults = this.data;
    }
  });
  
  var Doctype = makeClass(Term, {
    toJs: function(output) {
      var line = $.trim(this.data).toLowerCase();
      var bits = line.split(/\s+/);
      
      if(line.indexOf('xml') === 0) {
        var encoding = bits[1] || "utf-8";
        output.string("<?xml version='1.0' encoding='", encoding, "' ?>");
      } else if(options.html5) {
        output.string('<!DOCTYPE html>');
      } else {
        var version = bits[1], type = bits[0];
        if(!parseFloat(bits[1], 10) && !!parseFloat(bits[0], 10)) {
          version = bits[0];
          type = bits[1];
        }
      
        if(options.xhtml) {
          if(version === '1.1') output.string('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">');    
          else if(version === '5') output.string('<!DOCTYPE html>');
          else if(type === 'strict') output.string('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">');
          else if(type === 'frameset') output.string('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">');
          else if(type === 'mobile') output.string('<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">');
          else if(type === 'basic') output.string('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">');
          else output.string('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">');
        } else {
          if(type === 'strict') output.string('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">');
          else if(type === 'frameset') output.string('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">');
          else output.string('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">');
        }
      }
    }
  });
  
  var Comment = makeClass(Term, {
    initialize: function(parent, data) {
      this.data = data;
      this.attach(parent);
      
      this.start = '<!--';
      this.end = ' -->';
      
      if(this.data.charAt(0) == '[') {
        var endIndex = findEnd(this.data.substring(1), ']');
        this.start += this.data.substring(0, endIndex+2)+'>';
        this.data = this.data.substring(endIndex+2);
        this.end = ' <![endif]-->'
      }
      
      this.canIndent = /^\s*$/.exec(this.data) !== null;
    },
    
    toJs: function(output) {
      if(this.children.length === 0 && this.data.length === 0) return;
      
      output.string(this.start+" ");
      output.interpolatedString(this.data);
      this.processChildren(output);
      output.string(this.end);
    }
  });
  
  var Tag = makeClass(Term, {
    initialize: function(parent, data) {
      this.data = data;
      this.attach(parent);
      this.canIndent = true;
      
      var match = haml.regex.tag.exec(data);
      var tag = match[1], rest = match[2];
      
      var match = haml.regex.tagName.exec(tag);
      if(match === null) this.name = 'div';
      else this.name = match[1];
      
      this.id = $.map((tag.match(haml.regex.id) || []), function(str) { return str.substring(1); });
      this.id = this.id[this.id.length-1];
      this.classes = $.map((tag.match(haml.regex.cssClass) || []), function(str) { return str.substring(1); });
      this.attributes = {};
      this.attributesCount = 0;
      
      while(rest && rest.length > 0) {
        var nextChar = rest.charAt(0);
        switch(nextChar) {
          case '/': return this.autoclose = true;
          case ' ':
            if(haml.regex.blankLine.exec(rest)) {
              this.canIndent = true;
              return;
            }
            return new HamlInterpolatedString(this, rest.substring(1));
          case '=': return this.view.parser.rubyString(this, CodeOutput, rest.substring(1));
          case '(':
            var index = findEnd(rest, ')', 1);
            var str = rest.substring(1, index);
            rest = rest.substring(index+1);
            if(!this.parseAttributesVariable(str)) {
              this.parseAttributes(str, ' ', '=');
            }
            break;
          case '{':
            var index = findEnd(rest, '}', 1);
            var str = rest.substring(1, index);
            rest = rest.substring(index+1);
            
            if(!this.parseAttributesVariable(str)) {
              var match = haml.regex.lvalue.exec(str);
              if(match === null) throw this.view.error("Error while parsing the attributes hash for a tag.");
              else if(match[1] === ':') this.parseAttributes(str, ',', ':');
              else if(match[1] === '=>') this.parseAttributes(str, ',', '=>');
            }
            break;
          default: return new HamlInterpolatedString(this, rest);
        }
      }
    },
    
    parseAttributesVariable: function(str) {
      var match = haml.regex.attributesVariable.exec(str);
      if(match === null) return false;
      this.attributesVariableName = match[1];
      return true;
    },
    
    parseAttributes: function(str, attributeSeparator, nameSeparator) {
      while(str.length > 0) {
        var attributeEnd = findEnd(str, attributeSeparator);
        var attribute = str.substring(0, attributeEnd);
        var name = findEnd(attribute, nameSeparator);
        
        var nameStr = $.trim(attribute.substring(0, name));
        var match = haml.regex.attributeName.exec(nameStr);
        if(match !== null) nameStr = match[1];
        
        var valueStr = $.trim(attribute.substring(name+nameSeparator.length));
        if(valueStr.charAt(0) === ':') valueStr = '"'+valueStr.substring(1)+'"';
        
        this.attributes[nameStr] = valueStr;
        this.attributesCount += 1;
        str = str.substring(attributeEnd+1);
      }
    },
    
    mergeAttributes: function(name, values) {
      if(values.length === 0) return;
      var combinedClasses = values.join(' ');
      if(!this.attributes[name] || this.attributes[name].length === 0) {
        this.attributes[name] = $t("'#{values.join(\' \')}'", {values: values});
      } else {
        var expression = ['(', this.attributes[name], ')'].join('');
        this.attributes[name] = $t('"#{values.join(\' \')}" + " " + ((#{attributes[name]}) || "")', {attributes: this.attributes, name: name, values: values});
      }
    },
    
    toJs: function(output) {
      this.mergeAttributes('class', this.classes);
      if(!this.attributes.id && this.id) {
        this.attributes.id = '"'+this.id+'"';
        this.attributesCount++;
      }
      
      var attributesStr = [];
      for(var key in this.attributes) {
        attributesStr.push('"'+key+'": '+this.attributes[key]);
      }
      var attributesStr = $t('{#{attributesStr.join(\',\')}}', {attributesStr: attributesStr});
      var autoclose = this.children.length === 0 && (haml.autocloseTags[this.name] || this.autoclose);
      
      if(this.attributesCount === 0 && this.classes.length === 0 && !this.attributesVariableName) {
        if(autoclose) {
          output.string('<', this.name, ' />');
        } else {
          output.string('<', this.name, '>');
          this.processChildren(output);
          output.string('</', this.name, '>');
        }
      } else {
        output.code($t('__this.makeTag(\"<#{name}\", \"#{end}\", #{attributes}, #{attributesVariable});', {
          name: this.name,
          end: autoclose ? ' />' : '>',
          attributes: attributesStr, attributesVariable: this.attributesVariableName || "undefined"
        }));
        
        if(!autoclose) {
          this.processChildren(output);
          output.string('</', this.name, '>');
        }
      }
    }
  });
  
  var Parser = makeClass(null, {
    initialize: function(view) {
      this.view = view;
      this.lines = this.view.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      
      this.line = undefined;
      this.lineIndex = -1;
      this.level = 0;
      this.indentation = {
        amount: 2,
        character: ' ',
        notCharacter: '\t'
      };
      
      this.detectIndentation();
      this.nextLine();
    },
    
    detectIndentation: function() {
      var lines = [];
      for(var c = 0; c < this.lines.length; c++) {
        if(!haml.regex.blankLine.exec(this.lines[c])) {
          lines.push(this.lines[c]);
        }
      }
      this.lines = lines;
      
      for(var c = 0; c < this.lines.length; c++) {
        var line = this.lines[c];
        var match = haml.regex.lineWhitespace.exec(line);
        if(match == null) continue;
        
        var whitespace = match[1];
        if(haml.regex.onlyTab.exec(whitespace)) {
          this.indentation.character = '\t';
          this.indentation.notCharacter = ' ';
        } else if(!haml.regex.onlySpace.exec(whitespace)) throw this.view.error(haml.errors.mixedIndentation);
        this.indentation.amount = whitespace.length;
        break;
      }
    },
    
    nextLine: function(ignoreWhitespace) {
      this.line = this.lines[++this.lineIndex];
      if(this.line === undefined) return;
      if(ignoreWhitespace) return;
      
      var match = haml.regex.lineWhitespace.exec(this.line);
      if(match === null) {
        this.level = 0;
        return;
      }
      
      var whitespace = match[1];
      this.line = match[2];
      
      if(whitespace.indexOf(this.indentation.notCharacter) >= 0) throw this.view.error(haml.errors.mixedIndentation);
      if(whitespace.length % this.indentation.amount !== 0) throw this.view.error(haml.errors.unevenSpacing);
      
      this.level = whitespace.length / this.indentation.amount;
    },
    
    previousLine: function() {
      this.lineIndex -= 1;
    },
    
    parse: function(parent, indentLevel) {
      while(true) {
        if(this.level < indentLevel) return;
        if(this.line === undefined) return;
        
        if(this.level > indentLevel) throw this.error("Something was nested inside an element which cannot contain children.");
        
        var expression = this.compileLine(parent);
        if(haml.expression) {
          expression = haml.expression;
          haml.expression = undefined;
        }
        this.nextLine();
        
        if(!expression || expression.length) continue;
        if(expression.canIndent) this.parse(expression, indentLevel+1);
      }
    },
    
    compileLine: function(parent) {
      var line = this.line;
      var first = line.charAt(0);
      
      switch(first) {
        case '@': return new Defaults(parent, line.substring(1));
        case '\\': return [new HamlString(parent, line.charAt(1)), new HamlInterpolatedString(parent, line.substring(2))];
        case '/': return new Comment(parent, line.substring(1));
        case '!':
          if(line.indexOf('!!!') === 0) return new Doctype(parent, line.substring(3));
          break;
        case '%':
        case '.':
          return new Tag(parent, line);
        case '#':
          if(line.charAt(1) === '{') return new HamlInterpolatedString(parent, line);
          return new Tag(parent, line);
        case '=': return this.rubyString(parent, CodeOutput);
        case '-':
          if(line.charAt(1) === '#') return;
          return this.rubyString(parent, Code);
      }
      
      // default case
      return new HamlInterpolatedString(parent, line);
    },
    
    rubyString: function(parent, klass, line) {
      if(!line) line = this.line.substring(1);
      var lines = [];
      var first = true;
      while(true) {
        if(line === undefined) break;
        
        if(!first && haml.multilineStopCharacters[$.trim(line).charAt(0)]) {
          this.previousLine();
          break;
        }
        
        var match = haml.regex.multilineRuby.exec(line);
        line = line.substring(0, findEnd(line, "//"));
        if(match == null) {
          if(first) lines.push(line);
          else this.previousLine();
          break;
        }
        lines.push(match[1]);
        
        this.nextLine(true);
        first = false;
        line = this.line;
      }
      
      return new klass(parent, lines);
    }
  });
  
  haml.prototype = {
    compile: function(force) {
      //only compile the view once
      if(this.compiledView !== undefined && !force) return;
      
      this.defaults = '';
      this.root = new Root(undefined);
      this.root.view = this;
      this.parser = new Parser(this);
      this.parser.parse(this.root, 0);
      this.compiledView = this.root.toJs();
      this.evalCode();
    },
    
    /**
     * Compiles and runs the view
     * data and helpers are two objects that can be passed in and the items in their will be available as normal variables in the view
     */
    render: function(data, helpers) {
      if(!data) data = {};
      if(!helpers) helpers = {};
  
      this.output = [];
      this.compile();
      
      return this.renderFunction(data, helpers);
    },
    
    /**
     * Put the code in an anonymous function so it can be eval'd once and then called repeatedly, making it a lot faster.
     * Any default variable values or values passed to the render function are placed in with blocks so that they are available as local variables.
     * TODO: Integrate with JSLINT like EJS intelligently did.
     */
    evalCode: function() {
      var defaultsString = '{';
      if(this.defaults.length > 0) {
        defaultsString = "var __defaults = "+this.defaults+"; with(__defaults) {";
      }
      
      var evalString = "this.renderFunction = function(__data, __helpers) { "+defaultsString+" with(__data) { with(__helpers) { var __o = this.output, __this = this;\n"+this.compiledView+" \nreturn __o.join(\"\"); } } } };";
      this.debugStr = evalString;
      
      //console.log("compiling");
      //console.log(evalString);
      return eval(evalString);  
    },
    
    /**
     * Handles a Haml syntax error
     */
    error: function(message) {
      return $t("Haml Syntax Error: #{message} Line: #{lineNumber} Line: #{line}", {
        message: message,
        lineNumber: this.parser.lineIndex,
        line: this.parser.lines[this.parser.lineIndex].replace(/ /g, '[space]').replace(/\t/g, '[tab]')
      });
    },
    
    makeAttributes: function(attributes) {
      for(var key in attributes) {
        var value = attributes[key];
        if(value === undefined || value === null || value.length === 0) continue;
        if(key === 'checked' || key === 'selected') {
          attributes[key] = key;
        }
        this.output.push(' ', key, '="', value, '"');
      }
    },
    
    makeTag: function(tagBegin, tagEnd, attributes, moreAttributes) {
      if(moreAttributes && moreAttributes['class'] && moreAttributes['class'].length > 0 && 
          attributes['class'] && attributes['class'].length > 0) {
        attributes['class'] = attributes['class'] + ' ' + moreAttributes['class'];
        delete moreAttributes['class'];
      }
      this.output.push(tagBegin);
      this.makeAttributes(attributes);
      if(moreAttributes) this.makeAttributes(moreAttributes);
      this.output.push(tagEnd);
    }
  };
  
  function ltrim(str) {
    return str.replace(/^\s+/g, "");
  }
  /**
   * Escapes quotes and backslashes which could cause an injection attack in the generated code
   */
  function sanitize(text) {
    return text.replace(/\\/g, '\\\\').replace(/"/g,  '\\"');
  }
  
  //stolen from prototype.js (removed so as to be only dependent on jQuery)
  function makeClass(parent, methods) {
    function klass() {
      this.initialize.apply(this, arguments);
    }
    
    if (parent) {
      var subclass = function() { };
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
    }
    
    for(var name in methods) {
      klass.prototype[name] = methods[name];
    }
    
    klass.prototype.constructor = klass;
      
    if (!klass.prototype.initialize)
      klass.prototype.initialize = function() {};
    
    return klass;
  }
  
  // returns the index of needle in string, but ignores occurances of needle inside of parens/quotes/etc
  function findEnd(str, needle, start) {
    var chars = {"'": "'", '"': '"', '(': ')', '{': '}', '/': '/', '[': ']'};
    var stopBalancingChars = {"'": true, '"': true, '/': true};
    
    var c, len = str.length, cur, first = needle.charAt(0), second = needle.charAt(1), stack = [];
    str = str.split('');
    
    for(c = (start||0); c < len; c++) {
      cur = str[c];
      //ignore the character immediately after a backslash
      if(cur === '\\') {
        c++;
      } else if(stack.length === 0 && cur === first && (needle.length === 1 || str[c+1] === second)) {
        break;
      }
      
      //if we hit an ', ", or /, then keep iterating until we find the next one indicating the end of the string/regex and ignore everything inside
      else if(stopBalancingChars[cur]) {
        if(cur === '/') {
          if(str[c+1] === '/') return str.length;
          else continue;
        }
        
        c++;
        while(str[c] != cur && c < len) c += (1 + (str[c] === '\\'));
      }
      
      //if there are no elements on the stack, it cant be a closing character
      //if the closing character on the stack matches this one, then we're done
      else if(stack.length > 0 && cur === stack[stack.length-1]) {
        stack.pop();
      } else if(chars[cur]) {
        stack.push(chars[cur]);
      }
    }
    return c;
  }
  
  var templates = {};
  function $t(template, data) {
    data = data || {};
    //console.log(template);
    if(!templates[template]) {
      var code = sanitize(template).replace(haml.regex.simpleInterpolation, '", $1, "');
      code = ' \
      $.fxn = (function(__data) { \
        with(__data) { \
          return ["'+code+'"].join(""); \
        } \
      });';
      
      //console.log(code);
      eval(code);
      templates[template] = $.fxn;
    }
    
    return templates[template](data);
  }
  
  return haml;
})(jQuery);
