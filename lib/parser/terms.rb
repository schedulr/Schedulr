require 'rubygems'
require 'hpricot'
require 'open-uri'
require 'utils.rb'

module Schedulr
  class Parser
    def updateTerms
      Rails.logger.info "Executing: parseTerms at #{Time.now}"
      filename = File.join(Rails.root, 'parser/html/terms.html')
      url = "http://novasis.villanova.edu/pls/bannerprd/bvckschd.p_disp_dyn_sched"
      
      data = download(url, filename, true).gsub("<BR>", "")
      data = Hpricot(data)
      count = 0
      (data/'option').each do |option|
        code = option.attributes['value']
        name = option.inner_text.strip
        next if code.length == 0 || name == 'None' || name.length == 0
        
        semester, year = name.strip.split(/\s+/)
        
        term = Term.find_by_semester_and_year(semester, year)
        term = Term.create_from_parser(semester, year, code) unless term
      end 
    end
  end
end