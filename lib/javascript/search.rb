module Schedulr
  class JsObject
    def createSearchObject(str)
      str << "#{SEARCHNAME} = {};"
      str << "#{SEARCHNAME}.fullText = #{renderDict};"
      str << "#{SEARCHNAME}.crnDict = #{crnSearchDict};"
    end
    
    def renderDict
      badWords = {}
      %w{the this that not one may following enrolled must levels campuses university alliance undergraduate and requirement}.each{|word| badWords[word] = true}
      
      dict = buildDict({})
      procs = {
        department: Proc.new{|department| department.id.to_s},
        instructor: Proc.new{|instructor| instructor.id.to_s},
        course: Proc.new{|course| course.id.to_s},
        section: Proc.new{|section| section.id.to_s}
      }
      
      words = []
      str = dict.map do |word, value|
        next if badWords[word]
        categories = value.map do |category, matches|
          matchesString = matches.map{|match| procs[category].call(match) }
          "#{category}:[#{matchesString.join(',')}]"
        end
        next if categories.length == 0
        "{word:'#{e word}',#{categories.join(",")}}"
      end.compact
      
      "[#{str.join(",\n")}]"
    end
    
    def buildDict(searchDict)
      @sections.each{|section| addMatch([section.title], searchDict, section, :section) }
      @courses.each{|course| addMatch([course.description], searchDict, course, :course) }
      
      searchDict
    end
    
    def addMatch(strings, searchDict, match, category)
      words = []
      strings.compact.each{|str| words.concat(str.split(/[\s,\:\-\/\(\)\"]+/))}
      words.uniq.reject{|word| word.length < 3}.each{|word| addWord(word.downcase, searchDict, match, category)}
    end
    
    def addWord(word, searchDict, match, category)
      searchDict[word] ||= {}
      searchDict[word][category] ||= []
      searchDict[word][category] << match
    end
    
    def crnSearchDict
      sections = @sections.map{|section| "'#{section.crn}':#{section.id}"}
      "{#{sections.join(",")}}"
    end
  end
end