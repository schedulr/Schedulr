OBJNAME = 'd'
SEARCHNAME = 'window.search'
JS_ESCAPE_MAP	=	{ '\\' => '\\\\', '</' => '<\/', "\r\n" => '\n', "\n" => '\n', "\r" => '\n', '"' => '\\"', "'" => "\\'" }
TIMES, SECTIONS, INSTRUCTORS, DEPARTMENTS, COURSES, REQUIREMENTS, DATES, STRINGS = %w{t s i e c r a g}

def createJsfile
  Rails.logger.info "Executing: createJsfile at #{Time.now}"
  obj = JsObject.new
  
  data = []
  obj.createJsObject(data)
  obj.createSearchObject(data)
  data = data.join("\n")
  data.force_encoding("UTF-8").encode!
  
  dir = File.join(Rails.root, 'public/javascripts/generated')
  FileUtils.mkdir_p(dir)
  File.open(File.join(dir, 'data.js'), 'w') {|f| f.write(data) }
end

def e(str)
  #escape a string so it is safe for javascript, so an ' does not cause an error
  str ||= ''
  str.to_s.gsub(/(\\|<\/|\r\n|[\n\r"'])/) { JS_ESCAPE_MAP[$1] }
end

class JsObject
  def initialize
    @term = Term.schedulr_term
    @currentTerm = Term.current_term
    
    @departments = Department.all :order => 'name ASC', :include => {:courses => :course_sections}
    @sections = CourseSection.all :conditions => ['term_id = ?', @term.id], :include => [:requirements, :instructors, :course_section_times, :course]
    @courses = Course.all(:include => [:course_sections, :department]).reject{|course| course.course_sections.length == 0}
    @instructors = Instructor.all :order => 'name ASC', :include => :course_sections
    @requirements = Requirement.all :include => :course_sections
    
    @coursesDict = {}
    @courses.each{|course| @coursesDict[course.id] = course}
  end

  def createJsObject(str)
    str << 'var tmp, cur, d = {}; window.schedulrData = d;'
    
    courseTitles, sectionTitles = buildTitleDict
    createDates(str)
    createTerms(str)
    strings = createStrings(str)
    createDepartments(str)
    createCourses(str, strings, courseTitles)
    createRequirements(str)
    createInstructors(str)
    
    str << "d.sections = #{createSections(strings, sectionTitles)}; var s = d.sections;"
    
    str << createTimes
    str << createDays
    str << "var t = d.times;"
    
    str << referenceCoursesInDepartments
    str << referenceSectionsInCourses
    str << referenceSectionsInInstructors
    str << referenceSectionsInRequirements
  end
  
  def printString(str, strings)
    strings[str] != nil ? "#{STRINGS}[#{strings[str]}]" : "'#{e str}'"
  end
  
  def time_obj(hour, minute)
    minute % 5 != 0 ? "new SchedulrTime([#{hour},#{minute}])" : "#{DATES}[#{hour}][#{minute}]"
  end
  
  def buildTitleDict
    courses, courseTitles, sectionTitles = {}, {}, {}
    @sections.each{|section| (courses[section.course_id] ||= []) << section}
    
    courses.each do |course_id, sections|
      good = true
      title = sections[0].title
      for section in sections
        good = good && title == section.title
      end
      
      if good
        courseTitles[course_id] = e(title)
        for section in sections
          sectionTitles[section.id] = "#{COURSES}[#{course_id}].title"
        end
      else
        good = false
        if title.include?(":")
          common = title.split(":")[0]
          good = true
          for section in sections
            good = good && section.title.split(":")[0] == common
          end
        end
        
        courseTitles[course_id] = good ? "#{common}" : 'Multiples Courses'
        for section in sections
          sectionTitles[section.id] = "'#{e section.title}'"
        end
      end
      
    end
    
    return courseTitles, sectionTitles
  end
  
  def createTerms(str)
    str << "d.terms = {current: {start: new Date('#{@term.start_date}'),end: new Date('#{@term.end_date}'),code: '#{@term.code}'}};"
  end
  
  def createDates(str)
    str << "d.dates = {};"
    
    24.times do |hour|
      str2 = []
      12.times{|minute| str2 << "#{minute*5}: new SchedulrTime([#{hour},#{minute*5}])"}
      str << "d.dates[#{hour}]={#{str2.join(',')}};"
    end
    
    str << "var #{DATES} = d.dates;"
  end
  
  def createStrings(str)
    data, dict, indexDict = [], {}, {}
    
    @sections.each{|section| data << section.restrictions << section.notes << section.comment << section.prerequisites}
    @courses.each{|course| data << course.credits << course.description }
    data.each{|str| dict[str] ||= 0; dict[str] += 1}
    
    dict.reject{|word, count| count <= 1}.map{|word, count| word}.each_with_index{|word, index| indexDict[word] = index}
    
    str << "d.strings = [#{indexDict.map{|word, index| "'#{e(word)}'"}.join(',')}];"
    str << "var strings = d.strings; var #{STRINGS} = d.strings;"
    
    indexDict
  end
  
  #create the html for each of the basic data types.  references between the data types are added after all of the data has been created
  def createDepartments(str)
    str << "d.departments = {};"
    
    departments = @departments.map{|department| "#{department.id}:{code:'#{department.code}',name:'#{e department.name}',id:#{department.id}}"}
    str << "d.departments.dict = {#{departments.join(',')}};"
    str << "var #{DEPARTMENTS} = d.departments.dict;"
    
    departments = @departments.map{|department| "'#{e department.code}':#{DEPARTMENTS}[#{department.id}]"}
    str << "d.departments.code = {#{departments.join(',')}};"
    
    departments = @departments.map{|department| "#{DEPARTMENTS}[#{department.id}]"}
    str << "d.departments.list = [#{departments.join(',')}];"
  end
  
  def createCourses(str, strings, courseTitles)
    str << "d.courses = {};"

    courses = @courses.map{|course| "#{course.id}:{courseid:'#{course.courseid}',id:#{course.id},department_id:#{course.department_id},number: #{course.number},title:'#{course.number}: #{courseTitles[course.id]}',department:#{DEPARTMENTS}[#{course.department_id}],credits:#{printString course.credits, strings},description:#{printString course.description, strings}}"}
    str << "d.courses.dict = {#{courses.join(",\n")}};"
    str << "var #{COURSES} = d.courses.dict;"
    
    courses = @courses.map{|course| "'#{course.courseid}':#{COURSES}[#{course.id}]"}
    str << "d.courses.courseid = {#{courses.join(',')}};"
  end
  
  def createRequirements(str)
    str << "d.requirements = {};"
    
    reqs = @requirements.map{|req| "#{req.id}:{id:#{req.id},name:'#{e req.name}'}"}
    str << "d.requirements.dict = {#{reqs.join(',')}};"
    str << "var #{REQUIREMENTS} = d.requirements.dict;"
    
    reqs = @requirements.map{|req| "#{REQUIREMENTS}[#{req.id}]"}
    str << "d.requirements.list = [#{reqs.join(',')}];"
  end
  
  def createInstructors(str)
    str << "d.instructors = {};"
    
    instructors = @instructors.map{|instructor| "#{instructor.id}:{name:'#{e instructor.name}',ddt:'#{e instructor.sortName}',email:'#{e instructor.email}',id:#{instructor.id},sections:[]}"}
    str << "d.instructors.dict = {#{instructors.join(',')}};"
    str << "var #{INSTRUCTORS} = d.instructors.dict";
    
    instructors = @instructors.map do |instructor|
      email = (instructor.email || '').split('@')[0]
      next unless email.length > 0
      "'#{e email}':#{INSTRUCTORS}[#{instructor.id}]"
    end.compact
    str << "d.instructors.email = {#{instructors.join(',')}};"
    
    instructors = @instructors.map{|instructor| "#{INSTRUCTORS}[#{instructor.id}]"}
    str << "d.instructors.list = [#{instructors.join(',')}];"
    
    str << "d.instructors.grouped = #{createInstructorsGroupedList};"
  end
  
  def createInstructorsGroupedList
    str, ret = [], []
    previousLetter = 'a'
    
    instructors = @instructors.sort{|a, b| a.sortName <=> b.sortName}
    for instructor in instructors
      letter = instructor.sortName.downcase[0..0]
      next if instructor.course_sections.length == 0
      unless previousLetter == letter
        ret << "{letter:'#{previousLetter.upcase}',instructors:[#{str.join(',')}]}"
        str = []
        previousLetter = letter
      end
      str << "#{INSTRUCTORS}[#{instructor.id}]"
    end
    "[#{ret.join(',')}]"
  end
  
  def createSections(strings, sectionTitles)
    sections = @sections.map do |section|
      i = section.instructors.map{|instructor| "#{INSTRUCTORS}[#{instructor.id}]"}
      r = section.requirements.map{|req| "#{REQUIREMENTS}[#{req.id}]"}
      t = section.course_section_times.map{|time| "new SchedulrDate(#{time.day}, #{time_obj(time.start_hour, time.start_minute)}, #{time_obj(time.end_hour, time.end_minute)}, '#{e time.location}')"}
      day = section.course_section_times.inject(0) { |num, time| num | (1 << time.day) }
      
      "#{section.id}:{ddt:'#{section.to_s}',id:#{section.id},crn:'#{e section.crn}',comment:#{printString section.comment, strings},notes:#{printString section.notes, strings},restrictions:#{printString section.restrictions, strings},prerequisites:#{printString section.prerequisites, strings},title: #{sectionTitles[section.id]},course:#{COURSES}[#{section.course_id}],instructors:[#{i.join(',')}],requirements:[#{r.join(',')}],times:[#{t.join(',')}],days:#{day},sectionid:'#{section.course.courseid}-#{section.section_number}'}
  "
    end
    "{#{sections.join(',')}}"
  end
  
  def createTimes
    #create a list of the unique times that courses are offerred, and then list all of the courses at those times
    hours = []
    0.upto(24) do |hour|
      s = @sections.reject{|section| !section.course_section_times.any?{|time| time.start_hour == hour}}
      hours[hour] = s.uniq if s.length > 0
    end
    
    hours = hours.each_with_index do |sections, index|
      next unless sections
      
      #create a list of all of the different times in each course by grouping the sections by time in the dict hash
      dict = {}
      sections.each do |section|
        (dict[section.to_s] ||= []) << section
      end
      dict.delete_if{|key, sections| sections.length <= 2}
      
      #eliminate duplicates and sort it
      timeKeys = ['All']+dict.keys.uniq.sort{|a, b| dict[b].length <=> dict[a].length}
      dict['All'] = sections
      
      #sort the courses at each time
      dict.each_key{|key| dict[key] = dict[key].sort{|a, b| a.course.courseid <=> b.course.courseid}}
      
      timeObjects = timeKeys.map{|time| "{time:'#{time}',sections:[#{dict[time].map{|section| "#{SECTIONS}[#{section.id}]"}.join(',')}]}"}
      
      hour = "#{index % 12 == 0 ? '12' : index%12}:00 #{index <= 12 ? 'AM' : 'PM'}"
      hours[index] = "{hour:'#{e hour}',times:[#{timeObjects.join(',')}]}"
    end
    
    "d.times=[#{hours.compact.join(',')}];"
  end
  
  def createDays
    #create three lists, representing the time a course is taught, the days it is taught, and an integer sort value of those days
    times = @sections.map{|section| section.to_s}
    days = @sections.map{|section| section.days}
    daysSort = @sections.map{|section| section.daysSort}
    
    #merge the three arrays into one
    zipped = @sections.zip(times, days, daysSort)
    
    dayDict = {}
    #zipped.each will return an array of 3 strings, the time, days, and daySort value for a section
    #the two hashes will store arrays of the sections at that day or time
    zipped.each{|z| ((dayDict[z[2]] ||= {})[z[1]] ||= []) << z[0]}
    
    #sort the courses by courseid
    dayDict.each_key{|key| dayDict[key].each_key{|key2| dayDict[key][key2].sort{|a, b| a.course.courseid <=> b.course.courseid}}}
    
    #to use the sort values from daysSort, we have to merge the days and daysSort so the days stay associated with their sort value
    dayKeys = days.zip(daysSort).sort{|a, b| a[1] <=> b[1]}.map{|arry| arry[0]}.uniq
    
    #the times are now sorted, so turn them into html
    dayObjs = dayKeys.map do |key|
      keys = dayDict[key].keys.sort
      objs = keys.map do |timeKey|
        sectionids = dayDict[key][timeKey].sort{|a, b| a.course.courseid <=> b.course.courseid}.map{|section| "#{SECTIONS}[#{section.id}]"}
        next if sectionids.length < 3
        "{time:'#{timeKey}',sections:[#{sectionids.join(',')}]}"
      end.compact
      next if objs.length < 3
      "{days:'#{key}',times:[#{objs.join(',')}]}"
    end.compact
    
    "d.days=[#{dayObjs.join(',')}];"
  end
  
  def referenceCoursesInDepartments
    #create an array of all of the courses taught by each department
    @departments.map do |department| 
      c = department.courses.reject{|course| course.course_sections.length == 0}.sort{|a, b| a.courseid <=> b.courseid}.map{|course| "#{COURSES}[#{course.id}]"}
      "#{DEPARTMENTS}[#{department.id}].courses=[#{c.join(',')}];"
    end
  end
  
  def referenceSectionsInCourses
    #create an array of each of the course sections for each course
    @courses.map do |course|
      s = course.course_sections.map{|section| section.term_id == @term.id ? "#{SECTIONS}[#{section.id}]" : nil}.compact
      "#{COURSES}[#{course.id}].sections=[#{s.join(',')}];"
    end
  end
  
  def referenceSectionsInInstructors
    #create arrays of the courses and course sections for each professor
    #for some reason eager loading of courses does not work here
    @instructors.map do |instructor|
      sections = instructor.course_sections.reject{|section| section.term_id != @term.id}
      if sections.length > 0
        sections = sections.sort{|a, b| @coursesDict[a.course_id].courseid <=> @coursesDict[b.course_id].courseid}
        
        s = sections.map{|section| "#{SECTIONS}[#{section.id}]"}
        c = sections.map{|section| section.course_id}.uniq.map{|id| "#{COURSES}[#{id}]"}
        "#{INSTRUCTORS}[#{instructor.id}].sections=[#{s.join(',')}]; #{INSTRUCTORS}[#{instructor.id}].courses=[#{c.join(',')}];"
      else
        nil
      end
    end.compact
  end
  
  def referenceSectionsInRequirements
    #create arrays of the courses and course sections for each requirement
    #for some reason eager loading of courses does not work here
    @requirements.map do |requirement|
      sections = requirement.course_sections.reject{|section| section.term_id != @term.id}
      if sections.length > 0
        sections = sections.sort{|a, b| @coursesDict[a.course_id].courseid <=> @coursesDict[b.course_id].courseid}
      
        s = sections.map{|section| "#{SECTIONS}[#{section.id}]"}
        c = sections.map{|section| section.course_id}.uniq.map{|id| "#{COURSES}[#{id}]"}
        "#{REQUIREMENTS}[#{requirement.id}].sections=[#{s.join(',')}]; #{REQUIREMENTS}[#{requirement.id}].courses=[#{c.join(',')}];"
      else
        nil
      end
    end.compact
  end
  
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