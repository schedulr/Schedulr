require 'rubygems'
require 'hpricot'
require 'open-uri'
require 'utils.rb'

module Schedulr
  class Parser    
    def parse
      Rails.logger.info "Executing: parseCourses for #{@term.code} at #{Time.now}"
      doParse(true) do |file|
        @department = file[:department]
        courses = parse_courses file[:data]  
        
        stage 'Parsing Requirements'
        parseRequirements courses
    
        stage 'Merging'
        mergeSections(courses)
    
        stage 'Saving'
        courses.each do |course|
          course.term = @term
          course.save if course.changed? || course.new_record?
        end
      
        stage 'Initial'
      end
    end
    
    def stage(label)
      Rails.logger.debug "#{@stageLabel} #{@department.code if @department}: #{(Time.now.to_i() - @stageTime.to_i())}"
      puts "#{@stageLabel} #{@department.code if @department}: #{(Time.now.to_i() - @stageTime.to_i())}"
      @stageTime = Time.now
      @stageLabel = label
    end
    
    def deleteOldSections
      dict = {}
      @foundSections.each{|section| dict[section.crn] = section }
      
      for section in @sections
        if section && section.crn && !dict[section.crn]
          Rails.logger.info "Deleting Section: #{section.inspect}"
          section.full_destroy
        end
      end
    end
    
    def mergeSections(sections)
      currentSectionsHash, oldSectionsHash = {}, @sections
      i = 0
      
      for section in sections
        if oldSectionsHash[section.crn]
          oldSection = oldSectionsHash[section.crn]
          oldSection.term_id = section.term_id if section.term_id && oldSection.term_id != section.term_id
          oldSection.comment = section.comment unless oldSection.comment == section.comment
          oldSection.notes = section.notes unless oldSection.notes == section.notes
          oldSection.title = section.title unless oldSection.title == section.title
          
          oldSection.restrictions = section.restrictions unless oldSection.restrictions == section.restrictions
          oldSection.prerequisites = section.prerequisites unless oldSection.prerequisites == section.prerequisites
          oldSection.section_number = section.section_number unless oldSection.section_number == section.section_number
          
          oldSection.course = section.course
          oldSection.requirements = section.requirements
          oldSection.instructors = section.instructors
          oldSection.course_section_times = section.course_section_times
          
          sections[i] = oldSection
          currentSectionsHash[section.crn] = oldSection
        else
          currentSectionsHash[section.crn] = section
        end
        i += 1
      end
    end
    
    def mergeTimes(section, times) 
      oldSection = @sections[section.crn]
      return unless oldSection
      oldTimes = {}
      oldSection.course_section_times.each{|time| oldTimes[time.to_key] = time}
      0.upto(times.length-1) do |index|
        oldTime = oldTimes[times[index].to_key]
        times[index] = oldTime if oldTime
      end
    end
    
    def parseRequirements(courses)
      #add a reference to each requirement that each course fulfills
      requirements = {
        'Writing Enriched' => Proc.new{|course, number, notes| notes.include?('writing enriched requirement')},
        'Writing Intensive' => Proc.new{|course, number, notes| notes.include?('writing intensive requirement')},
        'Fine Arts' => Proc.new{|course, number, notes| notes.include?('fine arts requirement')},
        'Diversity One' => Proc.new{|course, number, notes| notes.include?('diversity requirement 1')},
        'Diversity Two' => Proc.new{|course, number, notes| notes.include?('diversity requirement 2')},
        'Diversity Three' => Proc.new{|course, number, notes| notes.include?('diversity requirement 3')},
        'Arab Islamic Studies' => Proc.new{|course, number, notes| notes.include?('arab and islamic studies conc')},
        'Africana Studies' => Proc.new{|course, number, notes| notes.include?('africana studies minor/conc')},
        'Peace and Justice' => Proc.new{|course, number, notes| notes.include?('peace & justice prog req')},
        'Gender and Women\'s Studies' => Proc.new{|course, number, notes| notes.include?('gender and women\'s studies')},
        'Advanced Literature' => Proc.new {|course, number, notes| notes.include?('advanced literature a & s core') || (course.course.department == @departments['ENG'] && number > 2100 && number < 6000 && !notes.include?('does not fulfill advanced literature requirement')) },
        'Advanced History' => Proc.new {|course, number, notes| course.course.department == @departments['HIS'] && number > 2000 && number < 6000 },
        'Advanced Theology' => Proc.new {|course, number, notes| course.course.department == @departments['THL'] && number > 2000 && number < 6000 },
        'Advanced Philosophy' => Proc.new {|course, number, notes| course.course.department == @departments['PHI'] && number > 2000 && number < 6000 }
      }
      
      requirements.each do |key, value|
        unless @requirements[key]
          req = Requirement.new :name => key
          req.save
          @requirements[key] = req
        end
      end
      
      for course in courses
        reqs = []
        notes, number = course.notes.downcase, course.course.number
        requirements.each do |key, value|
          ret = value.call(course, number, notes)
          reqs << @requirements[key] if ret
        end
        course.requirements = reqs
      end
    end
    
    #convert a string representation of a time to 24 hour time and return it as two ints
    def makeTime(str)
      bits = str.split ' '
      if bits.length > 0
        tbits = bits[0].split ':'
      
        hour = tbits[0].to_i
        minute = tbits[1].to_i
      
        hour += 12 if bits[1] == 'pm' && hour < 12
        return hour, minute
      end
      'TBA'
    end
    
    #methods for returning a course/instructor/department, and creating it if it does not exist
    def getCourse(department, number)
      c  = Course.new(:department => department, :number => number, :courseid => "#{department.code} #{number}")
      if @courses[c.courseid]
        c = @courses[c.courseid]
        c.department = department
      else
        @courses[c.courseid] = c
      end
      c.save
      c
    end
    
    def getInstructor(name, email)
      bits = name.strip.split(' ')
      s = 1
      1.upto(bits.length-1) do |i|
        #test if the length is two and the last character is a dot
        s = i+1 if bits[i][1..1] == '.'
      end
      firstname = bits[0..s].join(' ').strip
      lastname = bits[(s+1)..-1].join(' ').strip
      
      i = Instructor.new(:name => name, :email => email)
      @instructors[i.email] ||= i
    end
    
    def getDepartment(code)
      @departments[code]
    end
    
    #the main method for parsing courses
    def parse_courses(doc)
      doc = Hpricot(doc)
      stage "Parsing Courses"	
      sections = []
      
      t = 0
      (doc/'table.datadisplaytable').each do |table|
        rows = table/'tr' 
        index = 0 
        #puts "Table: #{t}"
        t += 1
          
        #each course consists of two rows, hence a while loop is needed
        #the first row has a th element, and the second has a td
        while index < rows.length-1 
          #puts index
          section = parse_course(rows[index], rows[index+1])
          sections << section if section
          index += 2
        end # end while
      end # end table search
      
      sections
    end
    
    def parse_course(row1, row2)
      #map days to integers
      days = {'M' => 0, 'T' => 1, 'W' => 2, 'R' => 3, 'F' => 4, 'S' => 5}
      section = CourseSection.new(:comment => '', :notes => '')
      
      information = row1/'th' 
      time = row2/'td' 
      instructorLinks = time/'a'
    
      link = information/'a'
      sub = link.inner_html
      subBits = sub.strip.split(' ', 2)
      departmentString = subBits[0]
      subBits = subBits[1].split('-')
      
      info = information.inner_text.strip
      info = info[sub.length.. -1]
      crnLoc = info.index('CRN')
      
      return nil if info.blank?
      
      # Gets the chunk of text including the day
      timeInfo = time.inner_text.strip
      daysLoc = timeInfo.index('Days:')
      locLoc = timeInfo.index('Location:')
      instLoc = timeInfo.index('Instructors:')
      commentLoc = timeInfo.index('Comment:')
      restLoc = timeInfo.index('Restrictions:')
      attributeLoc = timeInfo.index('Attributes:')
      prereqLoc = timeInfo.index('Prerequisites:')
      
      department = getDepartment(departmentString)
      return nil unless department
      
      course_number, section_number = subBits[0].strip.to_i, subBits[1].strip
      
      #TODO: what if there is no crn?  is this even necessary still?
      if crnLoc
        section.title = info[0, crnLoc-1]
        section.crn = info[crnLoc+4, 10-4].strip
      end
      
      course = getCourse(department, course_number)
      section.course = course
      section.section_number = section_number
      
      
      loc = restLoc || commentLoc || instLoc || locLoc
      data = loc ? timeInfo[daysLoc+ 6.. loc-1] : 'Not a Class'
      
      #sometimes there are more than 3 times for a course, and they are not always separated by a period
      #for instance, if there is a time, but no location, it says Location: TBA, but no period
      bits = data.split('.')
      times = []
      for bit in bits
        #puts "Doing bit: #{bit.inspect}"
        loop do
          #puts "Inner Loop bit: #{bit.inspect}"
          #puts bit.inspect
          inLoc = bit.index('in')
          fromLoc = bit.index('from')
          toLoc = bit.index('to')
          locationLoc = bit.index('Location: TBA')
          #puts "#{inLoc} #{fromLoc} #{toLoc} #{locationLoc}"
        
          #the end of the second time is either Location: TBA or in
          endLoc = inLoc || locationLoc
          endLoc = locationLoc if locationLoc && inLoc && inLoc > locationLoc
          if fromLoc && toLoc && endLoc
            start_hour, start_minute = makeTime(bit[fromLoc+5..toLoc-1].strip)
            end_hour, end_minute = makeTime(bit[toLoc+3..endLoc-1].strip)
            break if !end_minute || end_hour == 0
            
            time = CourseSectionTime.new({:start_hour => start_hour, :start_minute => start_minute, :end_hour => end_hour, :end_minute => end_minute})
            time.location = inLoc ? bit[inLoc+2..-1].strip : 'TBA'
            
            #the days could be like MWF, so this splits that into three separate times
            d = bit[1..fromLoc-1].strip
            #puts d.inspect
            0.upto(d.length-1) do |idx|
              t = time.clone
              #puts d[idx..idx]
              t.day = days[d[idx..idx]]
              next unless t.day
              times << t
            end
          else
            break
          end
          
          if inLoc && (!locationLoc || (inLoc < locationLoc))
            bit = bit[inLoc+2..-1]
          else
            bit = bit[endLoc+("Location: TBA".length)..-1]
          end
        end
      end
      
      mergeTimes(section, times)
      section.course_section_times = times
      
      instructors = []
      #iterate over each of the links, checking for links with a mailto: indicating an instructor name
      for link in instructorLinks
        href = link.attributes['href']
        name = link.attributes['target']
        next unless href && name
        next unless href.include?('@')
        email = href.split('mailto:')[-1]
        instructor = getInstructor(name, email)
        instructors << instructor unless instructors.include?(instructor)
      end
      section.instructors = instructors
      
      # grab the attributes if there are any
      if attributeLoc && (commentLoc || restLoc)
        loc = commentLoc || restLoc
        attributes = timeInfo[attributeLoc +13.. loc-1]
        section.notes = attributes.strip
      end
      
      # grab the comment
      if commentLoc && restLoc
        section.comment = timeInfo[commentLoc+ 10.. restLoc-3].strip
        section.comment = section.comment.gsub("&nbsp;", " ").gsub(/\s{2, 100}/, " ")
      end
      
      # grab the restrictions
      if restLoc 
      	#cant use an || here cuz 0 evaluates to false
      	loc = prereqLoc ? prereqLoc : 0
        restrictions = timeInfo[restLoc + 14.. loc -1]
        section.restrictions = restrictions.strip
        section.restrictions = section.restrictions.gsub("&nbsp;", " ").gsub(/\s{2, 100}/, " ")
      end
      
      # grabs the preqrequistes, if any
      if prereqLoc
        prerequisites = timeInfo[prereqLoc + 18.. -1]
        section.prerequisites = prerequisites.strip if prerequisites
      end
      
      section
    end
  end
end
