require 'god.rb'
require 'utils.rb'

require 'parser.rb'
require 'jsobject.rb'

require 'net/http'
require 'uri'

desc 'Grabs the courses from novasis and updates the db.'
task :parse_all => :environment do
  Schedulr::handleErrors do
    Schedulr::Parser.parseAll do |parser|
      parser.parse
      parser.parseEnrollment(true)
    end
  end
end

desc 'Grabs the courses from novasis and updates the db.'
task :parse_current_terms => :environment do
  Schedulr::handleErrors do
    Schedulr::Parser.parseCurrentTerms do |parser|
      parser.parse
      parser.parseEnrollment(true)
    end
  end
end

desc 'Parse Enrollment'
task :parse_enrollment => :environment do
  Schedulr::handleErrors do
    Schedulr::Parser.parseCurrentTerms do |parser|
      parser.parseEnrollment
    end
  end
end

desc 'Parse Terms'
task :parse_terms => :environment do
  Schedulr::handleErrors do
    parser = Schedulr::Parser.new.updateTerms
  end
end

desc 'Creates a js file of the data.'
task :create_jsfile => :environment do
  Schedulr::handleErrors do
    Schedulr::JsObject.create_all
  end
end

desc 'Manages the parser on different machines'
task :god => :environment do
  Rails.logger.auto_flushing = true
  god = God.new
  god.run
  Rails.logger.flush
end