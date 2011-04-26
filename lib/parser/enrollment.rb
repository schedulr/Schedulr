require 'rubygems'
require 'hpricot'
require 'open-uri'
require 'utils.rb'

module Schedulr
  class Parser    
    def enrollment(reDownload=true)
      Schedulr::log :info, "Executing: parseEnrollment for #{@term.code} at #{Time.now}"
      t = Time.now
      t = t.strftime("%I:%M %p")
      
      sections = {}
      CourseSection.where(:term_id => @term.id).all.each{|section| sections[section.crn] = section}
      
      crn, enrollment = nil
      regex = /(crn\:\s*[0-9]+)|(enrollment\:[^\.]+\.)/
      fullRegex = /full\s*([0-9]+)\s*students/
      enrollmentRegex = /([0-9]+)\s*of\s*([0-9]+)\s*students/
      
      data = []
      
      doParse(false, reDownload) do |file|
        department = file[:department]
        str = file[:data].downcase
        
        str.gsub(regex) do |match|
          if match.include? "crn:"
            crn = match[4..-1].strip
          elsif match.include? "enrollment:"
            enrollment = match[11..-1]
            
            if crn
              capacity, enrolled = 0, 0
              enrollment = enrollment.gsub("<b>", "").gsub("<i>", "").gsub("</i>", "")
              match = fullRegex.match(enrollment)
              if match
                enrolled = capacity = match[1]
              else
                match = enrollmentRegex.match(enrollment)
                enrolled = match[1]
                capacity = match[2]
              end
              
              enrolled = enrolled.to_i
              capacity = capacity.to_i
            
              section = sections[crn]
              
              if section
                #print "#{section.enrolled} of #{section.capacity} -> #{enrolled} #{capacity}\n"
                
                #section.enrolled = enrolled
                #section.capacity = capacity
                #section.save
                
                data << [section.id, enrolled, capacity]
              end
            end
            
            crn = nil
            enrollment = nil
          end
        end
        
        nil
      end
      
      str = data.map{|section| "#{section[0]}:[#{section[1]},#{section[2]}]"}.join(',')
      str = "$.enrollmentTime = '#{t}'; $.enrollment={#{str}}; $.enrollmentManager.update();"
      
      dir = File.join(Rails.root, "public/javascripts/generated/#{@term.code}")
      FileUtils.mkdir_p(dir)
      File.open(File.join(dir, 'enrollment.js'), 'w') {|f| f.write(str) }
    end
  end
end
