require 'god.rb'
require 'utils.rb'

require 'parser.rb'
require 'jsobject.rb'

require 'net/http'
require 'uri'

desc 'Run any of the various parsing jobs for a set of terms'
task :parse => :environment do |parser|
  Schedulr::handleErrors do
    params, jobs, terms = {}, ENV['jobs'], ENV['terms']
    unless jobs && terms
      puts "The jobs and terms parameters must be specified."
      puts "Required Options:"
      puts "jobs is a comma separated list of these values: courses,enrollment,descriptions,jsobject,terms,departments."
      puts "terms is the string all, current, debug."
      puts "Additional Options:"
      puts "use_cache=true -> Does not redownload html files from Novasis if they exist."
      puts "debug=true -> Prints extra logging information to the screen (instead of just to the log file)."
      puts "threaded=true -> Uses a thread pool to save course objects (Disabled)"
      exit
    end
    
    jobs.split(',').each{|job| params[job.strip.downcase] = true}
    terms = ENV['terms'] == 'all' ? Term.all : (ENV['terms'] == 'current' ? Term.current_terms : [Term.schedulr_term])
    
    # run the terms parser once if requested
    Schedulr::Parser.new.terms if jobs['terms']
    Schedulr::Parser.new.departments if jobs['departments']
    ActiveRecord::Base.connection.clear_query_cache
    
    # setup for the parser
    Schedulr::ThreadedQueue.load
    queue = Schedulr::ThreadedQueue.create{|course| course.save}
    
    # run the parser jobs one for each term requested
    if jobs['courses'] || jobs['enrollment']
      for term in terms
        parser = Schedulr::Parser.new(term, queue)
        parser.parse if jobs['courses']
        parser.enrollment if jobs['enrollment']
        ActiveRecord::Base.connection.clear_query_cache
      end
    end
    
    if jobs['jsobject']
      jsObject = Schedulr::JsObject.new 
      # run the parser jobs one for each term requested
      for term in terms
        jsObject.generate(term) if jobs['jsobject']
      end
    end
    
    # run this after the courses have been parsed
    ActiveRecord::Base.connection.clear_query_cache
    Schedulr::Parser.new.descriptions if jobs['descriptions']
    
    #cleanup
    queue.complete
  end
end

desc 'Manages the parser on different machines'
task :god => :environment do
  Rails.logger.auto_flushing = true
  God.new.run
  Rails.logger.flush
end