require 'rubygems'
require 'hpricot'
require 'open-uri'
require 'utils.rb'

require 'parser/departments.rb'
require 'parser/descriptions.rb'
require 'parser/enrollment.rb'
require 'parser/courses.rb'

module Schedulr
  class Parser
    @stageTime = Time.now
    @stageLabel = 'Initial'
    
    def initialize
      @term = Term.schedulr_term
      @code = @term.code
      loadData
      
      @parseDepartments = Department.all(:order => 'name')
      #@parseDepartments = [Department.find(59)]
    end
    
    def doParse(parse)
      @stageTime = Time.now
      @files = []
      @department = nil
      @count = 0
      @mutex = Mutex.new
      
      for department in @parseDepartments
        downloadDepartmentData department, parse
      end
      
      max = 300
      while true
        @mutex.lock
        shouldBreak = @files.length >= @parseDepartments.length
        @mutex.unlock
        break if shouldBreak
        
        sleep 0.1
        max -= 1
        break if max <= 0
      end
      
      for file in @files
        yield file
      end
    end
    
    def loadData
      #create hashtables of all of the existing data in the database so it is only saved once
      @departments = {}
      Department.all.each{|department| @departments[department.code] = department}
    
      @instructors = {}
      Instructor.all.each{|instructor| @instructors[instructor.email] = instructor}
    
      @requirements = {}
      Requirement.all.each{|requirement| @requirements[requirement.name] = requirement}
    
      @courses = {}
      Course.all(:include => [:department]).each{|course| @courses[course.courseid] = course}
    
      @sections = {}
      CourseSection.all(:include => [:instructors, :requirements, :course_section_times, :course]).each{|section| @sections[section.crn] = section}
      
      @departmentCourses = {}
      @departmentSections = {}
      @departments.each_key do |code| 
        @departmentCourses[code] = {}
        @departmentSections[code] = {}
      end
      
      @courses.each{|courseid, course| @departmentCourses[course.department.code][courseid] = course}
      @sections.each{|crn, section| @departmentSections[@courses[section.course.courseid].department.code][crn] = section}
    end
  end
end
