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
      puts "jobs is a comma separated list of these values: courses,enrollment,descriptions,jsobject,terms,departments."
      puts "terms is the string all, current, debug."
      exit
    end
    
    jobs.split(',').each{|job| params[job.strip.downcase] = true}
    terms = ENV['terms'] == 'all' ? Term.all : (ENV['terms'] == 'current' ? Term.current_terms : [Term.schedulr_term])
    
    # run the terms parser once if requested
    Schedulr::Parser.new.updateTerms if jobs['terms']
    Schedulr::Parser.new.departments if jobs['departments']
    
    # setup for the parser
    Schedulr::ThreadedQueue.load
    queue = Schedulr::ThreadedQueue.create{|course| course.save}
    jsObject = Schedulr::JsObject.new if jobs['jsobject']
    
    # run the parser jobs one for each term requested
    for term in terms
      if jobs['courses'] || jobs['enrollment'] || jobs['descriptions']
        parser = Schedulr::Parser.new(term, queue)
        parser.parse if jobs['courses']
        parser.enrollment if jobs['enrollment']
        parser.descriptions if jobs['descriptions']
        parser.departments if jobs['departments']
      end
      jsObject.generate(term) if jobs['jsobject']
    end
    
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