/**
 * Department and Instructor names are transformed into tries when the application loads.
 * This is a fairly quick process, but is too much data to precompute in the data.js file
 * The data.js file contains a hashtable of crn numbers and a fullText index of course descriptions and titles
 * There are a series of functions in doSearch which attempt to extra meangingful information from the search string,
 * such as CSC 1051 or CSC or something.  If none of them find information, a fulltext search is done.
 */
var SearchEngine = (function($) {
  var options = $.extend(true, {}, $.config.search);

  return Class.create({
    initialize: wrap(function() {
      this.index = window.search.fullText;
      
      this.searchBox = $("#search");
      
      var dropShadow = $($.shadowTemplate.render()).insertAfter(this.searchBox);
      this.searchBox.remove().appendTo($('.dropShadowContent', this.dropShadow));
      
      this.searchBox = $("#search");
      this.searchBox.keyup(this.onSearch.wrap(this));
      this.searchBox.focus(this.setState.wrap(this)).blur(this.setState.wrap(this));
      
      this.clearResults();
      this.previousVal = "";
      
      this.regex = {
        courseId: /([a-z]{2,4})\s*([0-9]{2,5})/,
        normalize: /[ ,\:\-\/\(\)\"]+/g,
        crn: /[0-9]{5,6}/,
        numbers: /[0-9]{2,5}/
      };
      
      this.searches = [];
      this.searchTimeout = undefined;
      
      this.createTries();
    }),
    
    createTries: function() {
      this.trie = {
        department: this.createTrie(schedulrData.departments.list, 'name'),
        instructor: this.createTrie(schedulrData.instructors.list, 'name', true)
      };
    },
    
    // The trie is organized with one letter as a key
    // Each letter points to either an object or undefined
    // The object can contain a $ key which points to an array of the integer ids of the objects that match that path
    createTrie: function(data, property, splitWhitespace) {
      var root = {};
      for(var c = 0; c < data.length; c++) {
        var id = data[c].id;
        var word = [data[c][property].toLowerCase().replace(this.regex.normalize, " ").replace(/\s+/g, " ").trim()];
        if(splitWhitespace) word = word[0].split(/\s+/);
        
        for(var e = 0; e < word.length; e++) {
          var letters = word[e].split("");
          if(letters.length < 3) continue;
          
          var trie = root;
          for(var d = 0; d < letters.length; d++) {
            var letter = letters[d];
            var element = trie[letter];
            
            if(d === letters.length-1) {
              if(element === undefined) {
                trie[letter] = {$: [id]};
              } else if(element.$ === undefined) {
                element.$ = [id];
              } else {
                trie[letter].$.push(id);
              }
            } else {
              if(element === undefined) {
                trie[letter] = {};
              }
              trie = trie[letter];
            }
          }
        }
      }
      
      return root;
    },
    
    searchTrie: function(trie, needle) {
      var words = needle.split(/\s+/);
      var matches = [];
      var matchedWords = {};
      for(var c = 0; c < words.length; c++) {
        var root = trie;
        for(var d = c; d < words.length; d++) {
          root = this.searchTrieWord(root, words[d]);
          if(root === false) break;
          
          if(root.$) {
            for(var e = c; e <= d; e++) {
              matchedWords[e] = true;
            }
            Array.prototype.push.apply(matches, root.$);
          }
          
          while(root[' '] !== undefined) root = root[' '];
        }
      }
      
      var newWords = [];
      for(var c = 0; c < words.length; c++) {
        if(!matchedWords[c]) newWords.push(words[c]);
      }
      return {matches: matches, search: newWords.join(' ')};
    },
    
    searchTrieWord: function(trie, word) {
      var letters = word.split("");
      for(var c = 0; c < letters.length; c++) {
        trie = trie[letters[c]];
        if(trie === undefined) return false;
      }
      
      return trie;
    },
    
    logSearch: function(search) {
      this.searches.push(search);
      if(this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(this.sendSearch.wrap(this), 10*1000);
    },
    
    sendSearch: function() {
      this.searchTimeout = undefined;
      Ajax.silent(options.url, {data: {searches: this.searches}});
      this.searches = [];
    },
    
    clearResults: function() {
      return this.results = {department: [], course: [], section: [], instructor: []};
    },
    
    setState: function() {
      if(this.searchBox.val().length == 0) {
        this.searchBox.removeClass('active');
        this.searchBox.val('Search Courses');
      } else if(this.searchBox.val() == 'Search Courses'){
        this.searchBox.addClass('active');
        this.searchBox.val("");
      }
    },
    
    addMatches: function(key, matches) {
      matches = matches[key];
      if(!matches) return;
      
      var match;
      for(var c = 0; c < matches.length; c++) {
        this.addMatch(key, matches[c]);
      }
    },
    
    addMatch: function(key, match) {
      if(this.tables[key][match] !== undefined) {
        this.tables[key][match] += 1;
      } else {
        this.tables[key][match] = 0;
        this.results[key].push(match);
      }
      
      return "";
    },
    
    sortResults: function() {
      var keys = $w("department course section instructor");
      for(var c = 0; c < keys.length; c++) {
        this.results[keys[c]].sort((function(a, b) {
          return this.tables[keys[c]][b] - this.tables[keys[c]][a];
        }).bind(this));
      }
    },
    
    onSearch: function(event) {
      if(this.previousVal == this.searchBox.val()) return;
      
      this.results = {department: [], course: [], section: [], instructor: []};
      this.tables = {department: {}, course: {}, section: {}, instructor: {}};
      this.logSearch(this.searchBox.val());
      this.doSearch(this.searchBox.val());
      this.sortResults();
      this.previousVal = this.searchBox.val();
      
      $.drillDown.openRow(0, 5);
      event.stopPropagation();
    },
    
    doSearch: function(search) {
      if(!this.trie === undefined) this.createTries();
      search = search.trim().toLowerCase().replace(this.regex.normalize, " ").replace(/\s+/g, " ");
      if(search.length < 2) return this.clearResults();
      
      var functions = $w("parseCourseIds parseDepartments parseDepartmentNames parseInstructorNames parseCrns parseNumbers fullTextSearch");
      for(var c = 0; c < functions.length; c++) {
        var fxn = this[functions[c]];
        search = fxn.call(this, search).trim();
        if(search.length === 0) return;
      }
    },
    
    parseNumbers: function(search) {
      return this.gsub(search, this.regex.numbers, function(match) {
        var number = parseInt(match[0], 10);
        var departments = this.results['department'];
        var instructors = this.results['instructor'];
        var foundMatch = false;
        
        for(var c = 0; c < departments.length; c++) {
          var courses = schedulrData.departments.dict[departments[c]].courses;
          for(var d = 0; d < courses.length; d++) {
            if(courses[d].number === number) {
              this.addMatch('course', courses[d].id);
              foundMatch = true;
            }
          }
        }
        
        for(var c = 0; c < instructors.length; c++) {
          var sections = schedulrData.instructors.dict[instructors[c]].sections;
          for(var d = 0; d < sections.length; d++) {
            if(sections[d].course.number === number) {
              this.addMatch('section', sections[d].id);
              foundMatch = true;
            }
          }
        }
        
        if(foundMatch) return "";
      });
    },
    
    parseDepartmentNames: function(search) {
      var result = this.searchTrie(this.trie.department, search);
      if(result.matches.length > 0) {
        for(var c = 0; c < result.matches.length; c++) {
          this.addMatch('department', result.matches[c]);
        }
        return result.search;
      }
      return search;
    },
    
    parseInstructorNames: function(search) {
      var result = this.searchTrie(this.trie.instructor, search);
      if(result.matches.length > 0) {
        for(var c = 0; c < result.matches.length; c++) {
          this.addMatch('instructor', result.matches[c]);
        }
        return result.search;
      }
      return search;
    },
    
    parseCourseIds: function(search) {
      return this.gsub(search, this.regex.courseId, function(match) {
        var code = match[1].toUpperCase();
        var number = match[2];
        var course = schedulrData.courses.courseid[code+' '+number];
        
        if(course) return this.addMatch('course', course.id);
      });
    },
    
    parseDepartments: function(search) {
      var bits = search.split(/\s+/);
      var ret = [];
      for(var c = 0; c < bits.length; c++) {
        var department = schedulrData.departments.code[bits[c].toUpperCase()];
        if(department) {
          this.addMatch('department', department.id);
        } else {
          ret.push(bits[c]);
        }
      }
      
      return ret.join(' ');
    },
    
    parseCrns: function(search) {
      return this.gsub(search, this.regex.crn, function(match) {
        var course = window.search.crnDict[match[0]];
        if(course) return this.addMatch('section', course);
      });
    },
    
    gsub: function(search, regex, callback) {
      var ret = "";
      do {
        search = search.trim();
        var match = regex.exec(search);
        if(match === null) return ret+search;
        
        var replacement = callback.call(this, match);
        if(replacement === undefined) replacement = match[0];
        
        ret += search.substring(0, match.index) + replacement;
        search = search.substring(match.index+match[0].length);
      } while(search.length > 0);
      
      return ret;
    },
    
    fullTextSearch: function(search) {
      var terms = search.split(/\s+/);
      for(var c = 0; c < terms.length; c++) {
        var term = terms[c];
        if(term.length < 3) continue;
        
        for(var d = 1, wordCount = this.index.length; d < wordCount; d++) {
          var result = this.index[d];
          if(result.word.indexOf(term) >= 0) {
            this.addMatches('department', result);
            this.addMatches('course', result);
            this.addMatches('section', result);
            this.addMatches('instructor', result);
          }
        }
      }
      return "";
    },
    
    drillDownCallback: function(obj) {
      var items = [];
      if(this.results.department.length) items.push('Departments ('+this.results.department.length+')');
      if(this.results.course.length) items.push('Courses ('+this.results.course.length+')');
      if(this.results.section.length) items.push('Course Sections ('+this.results.section.length+')');
      if(this.results.instructor.length) items.push('Instructors ('+this.results.instructor.length+')');
      
      return {
        items: items,
        callback: this.drillDownTypeCallback.bind(this)
      }
    },
    
    drillDownTypeCallback: function(obj) {
      if(obj.startsWith('Departments')) {
        if(!this.results.departmentObjects) this.results.departmentObjects = $.map(this.results.department, function(id) { return schedulrData.departments.dict[id]; });
        return {items: this.results.departmentObjects, textKey: 'name', callback: $.drillDownCallbacks.courses};
      }
      if(obj.startsWith('Courses')) {
        if(!this.results.courseObjects) this.results.courseObjects = $.map(this.results.course, function(id) { return schedulrData.courses.dict[id]; });
        return {items: this.results.courseObjects, textKey: 'title', callback: $.drillDownCallbacks.sections};
      }
      if(obj.startsWith('Course Sections')) {
        if(!this.results.sectionObjects) this.results.sectionObjects = $.map(this.results.section, function(id) { return schedulrData.sections[id]; });
        return {items: this.results.sectionObjects, textKey: 'title', fin: true, classCallback: $.drillDownFilters.conflict, callback: $.drillDownCallbacks.sectionDetails};
      }
      if(obj.startsWith('Instructors')) {
        if(!this.results.instructorObjects) this.results.instructorObjects = $.map(this.results.instructor, function(id) { return schedulrData.instructors.dict[id]; });
        return {items: this.results.instructorObjects, textKey: 'name', callback: $.drillDownCallbacks.instructorSections};
      }
    }
  });
})(jQuery);