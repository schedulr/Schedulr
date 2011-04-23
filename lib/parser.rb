require 'rubygems'
require 'hpricot'
require 'open-uri'
require 'utils.rb'

require 'parser/departments.rb'
require 'parser/descriptions.rb'
require 'parser/enrollment.rb'
require 'parser/courses.rb'
require 'parser/terms.rb'
require 'queue.rb'

module Schedulr
  class Parser    
    attr_accessor :term
    
    @stageTime = Time.now
    @stageLabel = 'Initial'
    
    def self.parseAll
      #terms = Term.all(:conditions => ['id > 14'])
      #terms = [Term.find(1), Term.find(6)]
      terms = [Term.find(1)]
      #terms = Term.all
      
      queue = Schedulr::ThreadedQueue.create{|course| puts 'saving'; course.save}
      for term in terms
        puts "Parsing #{term.code}"
        parser = Parser.new term, queue
        yield parser
      end
      queue.complete
    end
    
    def self.parseCurrentTerms
      term = Term.schedulr_term
      terms = Term.where(:year => [term.year, term.year+1])
      terms = terms + Term.where(:year => term.year-1) if term.semester == 'Spring'
      
      queue = Schedulr::ThreadedQueue.create{|course| course.save}
      for term in terms
        puts "Parsing Current Term #{term.code}"
        parser = Parser.new term, queue
        yield parser
      end
      queue.complete
    end
    
    def initialize(term=Term.schedulr_term, queue=nil)
      @term = term
      @code = @term.code
      @queue = queue
      
      loadData
      
      @parseDepartments = Department.all(:order => 'name')
      #@parseDepartments = [Department.find(59)]
    end
    
    def doParse(parse, reDownload=true)
      @stageTime = Time.now
      @files = []
      @department = nil
      @count = 0
      
      for department in @parseDepartments
        downloadDepartmentData department, parse, reDownload
      end
      
      max = 200
      while true
        shouldBreak = @files.length >= @parseDepartments.length
        break if shouldBreak
        
        sleep 0.1
        max -= 1
        if max <= 0
          puts "TIMEOUT"
          break
        end
      end
      
      for file in @files
        yield file
      end
    end
    
    def downloadDepartmentData(department, parse, reDownload)
      Rails.logger.debug "Download Data for #{department.code}"
      thread = Thread.new do
        FileUtils.mkdir_p(File.join(Rails.root, "parser/html/#{department.code}"))
        filename = File.join(Rails.root, "parser/html/#{department.code}/#{@code}.html")
        
        url = "http://novasis.villanova.edu/pls/bannerprd/bvckschd.p_get_crse_unsec?begin_ap=a&begin_hh=0&begin_mi=0&end_ap=a&end_hh=0&end_mi=0&sel_attr=dummy&sel_attr=%25&sel_camp=dummy&sel_crse=&sel_day=dummy&sel_from_cred=&sel_insm=dummy&sel_instr=dummy&sel_instr=%25&sel_levl=dummy&sel_ptrm=dummy&sel_schd=dummy&sel_sess=dummy&sel_subj=dummy&sel_subj=#{department.code}&sel_title=&sel_to_cred=&term_in=#{@code}"
        
        data = Schedulr::download(url, filename, parse, false, reDownload)
      
        unless ENV['use_cache']
          #remove the file so if wget ever fails we error out rather than using old data
          #FileUtils.mv(filename, movedFilename)
        end
        
        @files << {:data => data, :department => department}
        Rails.logger.debug "Received Data for #{department.code}"
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
      CourseSection.where(:term_id => @term.id).all(:include => [:instructors, :requirements, :course_section_times, :course]).each{|section| @sections[section.crn] = section}
      
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
