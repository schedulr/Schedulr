require 'javascript/data.rb'
require 'javascript/search.rb'

#escape a string so it is safe for javascript, so an ' does not cause an error
JS_ESCAPE_MAP = { '\\' => '\\\\', '</' => '<\/', "\r\n" => '\n', "\n" => '\n', "\r" => '\n', '"' => '\\"', "'" => "\\'" }
def e(str)
  (str || '').to_s.gsub(/(\\|<\/|\r\n|[\n\r"'])/) { JS_ESCAPE_MAP[$1] }
end

module Enumerable
  def in_term(term)
    self.reject{|item| item.term_id != term.id}
  end
  
  def sections_term(term)
    self.reject{|course| course.course_sections.in_term(term).length == 0}
  end
end

module Schedulr
  class JsObject
    OBJNAME = 'd'
    SEARCHNAME = 'window.search'
    TIMES, SECTIONS, INSTRUCTORS, DEPARTMENTS, COURSES, REQUIREMENTS, DATES, STRINGS = %w{t s i e c r a g}
    
    def initialize
      @departments = Department.all :order => 'name ASC', :include => {:courses => :course_sections}
      @courses = Course.all(:include => [:course_sections, :department]).reject{|course| course.course_sections.length == 0}
      @instructors = Instructor.all :order => 'name ASC', :include => :course_sections
      @requirements = Requirement.all :include => :course_sections
      
      @coursesDict = {}
      @courses.each{|course| @coursesDict[course.id] = course}
    end
    
    def generate(term)
      @term = term
      @sections = CourseSection.all :conditions => ['term_id = ?', @term.id], :include => [:requirements, :instructors, :course_section_times, :course]
      @termCourses = @courses.sections_term(@term)
      
      Schedulr::log :info, "Executing: createJsfile for #{term.code} at #{Time.now}"
      
      data = []
      createJsObject(data)
      createSearchObject(data)
      
      data = data.join("\n")
      data.force_encoding("UTF-8").encode!
      
      dir = File.join(Rails.root, "public/javascripts/generated/#{term.code}")
      FileUtils.mkdir_p(dir)
      File.open(File.join(dir, 'data.js'), 'w') {|f| f.write(data) }
    end
  end
end