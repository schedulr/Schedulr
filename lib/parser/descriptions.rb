require 'rubygems'
require 'hpricot'
require 'open-uri'
require 'utils.rb'

module Schedulr
  class Parser
    def updateDescriptions
      Rails.logger.info "Executing: parseDescriptions at #{Time.now}"
      filename = File.join(Rails.root, 'parser/html/catalog.html')
      departments = Department.all.map{|department| "sel_subj=#{department.code}"}.join('&')
      url = "http://novasis.villanova.edu/pls/bannerprd/bvckctlg.p_display_courses?sel_attr=dummy&sel_attr=%25&sel_coll=dummy&sel_coll=%25&sel_crse_end=&sel_crse_strt=&sel_dept=dummy&sel_dept=%25&sel_divs=dummy&sel_divs=%25&sel_from_cred=&sel_levl=dummy&sel_levl=%25&sel_schd=dummy&sel_schd=%25&sel_subj=dummy&#{departments}&sel_title=&sel_to_cred=&term_in=#{Term.current_term.code}"
      
      data = download(url, filename, true).gsub("<BR>", "")
      data = Hpricot(data)
      count = 0
      (data/'table.datadisplaytable').each do |table|
        rows = table/'tr'
        next if rows.length < 2
        
        cols = rows[0]/'td'
        next if cols.length < 1
        code = cols[0].inner_text
            
        course = @courses[code]
        unless course
          match = (/([a-z]+)\s*([0-9]+)/i).match(code)
          next unless match
          
          code = "#{match[1]} #{match[2].to_i}"
          course = @courses[code]
          next unless course
        end
        
        cols = rows[1]/'td'
        next if cols.length < 2
        next unless cols[0].inner_text.downcase.strip == 'description:'
        
        description = cols[1].inner_text
        credits = nil
        
        match = (/(.*)([0-9]+\.[0-9]*\s*Credit(?:\(s\))?)/i).match(description)
        description, credits = match[1], match[2] if match
        
        #puts [code, description, credits, course, match].inspect if code == "PHY 4000"
        course.description = description
        course.credits = credits
        course.save
      end 
    end
  end
end
