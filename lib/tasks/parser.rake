require 'god.rb'
require 'utils.rb'

require 'parser.rb'
require 'jsobject.rb'

require 'net/http'
require 'uri'

desc 'Grabs the courses from novasis and updates the db.'
task :parse_courses => :environment do  
  include Schedulr
  Rails.logger.auto_flushing = true
  handleErrors do
    parser = Parser.new
    parser.updateDepartments
    parser.parse([0, 0, -1])
  end
  Rails.logger.flush
end

desc 'Parse Enrollment'
task :parse_enrollment => :environment do
  include Schedulr
  Rails.logger.auto_flushing = true
  handleErrors do
    parser = Parser.new
    parser.parseEnrollment
  end
  Rails.logger.flush
end

desc 'Parse Departments'
task :parse_departments => :environment do
  include Schedulr
  Rails.logger.auto_flushing = true
  handleErrors do
    parser = Parser.new
    parser.updateDepartments
  end
  Rails.logger.flush
end

desc 'Parse Descriptions'
task :parse_descriptions => :environment do
  include Schedulr
  Rails.logger.auto_flushing = true
  handleErrors do
    parser = Parser.new
    parser.updateDescriptions
  end
  Rails.logger.flush
end


desc 'Creates a js file of the data.'
task :create_jsfile => :environment do
  include Schedulr
  Rails.logger.auto_flushing = true
  handleErrors do
    createJsfile
  end
  Rails.logger.flush
end

desc 'Manages the parser on different machines'
task :god => :environment do
  Rails.logger.auto_flushing = true
  god = God.new
  god.run
  Rails.logger.flush
end

desc 'Parsers course data'
task :slave => :environment do
  Rails.logger.auto_flushing = true
  slave = Slave.new ENV['slave'].to_i
  slave.run
  Rails.logger.flush
end

task :god2 => :environment do
  Rails.logger.auto_flushing = true
  god = God.new
  god.startEnrollment
  god.startDepartments
  Rails.logger.flush
end

desc 'Remove Duplicates'
task :remove_duplicates => :environment do
  crns = ActiveRecord::Base.connection.select_all 'SELECT crn FROM course_sections GROUP BY crn HAVING COUNT(*) > 1'
  for crn in crns
    courses = CourseSection.where({:crn => crn['crn']}).all
    puts "WTF #{courses.inspect}" if courses.length < 0
    course = courses[0]
    1.upto(courses.length-1) do |index|
      badCourse = courses[index]
      ActiveRecord::Base.connection.execute "UPDATE course_sections_schedules SET course_section_id = #{course.id} WHERE course_section_id = #{badCourse.id}"
      ActiveRecord::Base.connection.execute "DELETE FROM course_sections WHERE id = #{badCourse.id}"
      ActiveRecord::Base.connection.execute "DELETE FROM course_section_times WHERE course_section_id = #{badCourse.id}"
      ActiveRecord::Base.connection.execute "DELETE FROM course_sections_instructors WHERE course_section_id = #{badCourse.id}"
      ActiveRecord::Base.connection.execute "DELETE FROM course_sections_requirements WHERE course_section_id = #{badCourse.id}"
    end
  end
  
  puts ActiveRecord::Base.connection.select_all 'SELECT * FROM course_sections_schedules WHERE course_section_id NOT IN(SELECT id FROM course_sections)'
end


desc 'Remove Duplicates'
task :remove_duplicates2 => :environment do
  crns = ActiveRecord::Base.connection.select_all 'SELECT *, COUNT(*) AS c FROM course_sections_schedules GROUP BY course_section_id, schedule_id HAVING c > 1'
  for crn in crns
    ActiveRecord::Base.connection.execute "DELETE FROM course_sections_schedules WHERE course_section_id = #{crn["course_section_id"]} AND schedule_id = #{crn["schedule_id"]}"
    ActiveRecord::Base.connection.execute "INSERT INTO course_sections_schedules (course_section_id, schedule_id) VALUES (#{crn["course_section_id"]}, #{crn["schedule_id"]})"
  end
end

desc 'Test Email'
task :test_email => :environment do
  Notifications.deliver_noTerm
end
