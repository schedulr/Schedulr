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