require 'rubygems'
require 'hpricot'
require 'open-uri'
require 'utils.rb'

module Schedulr
  class Parser
    def updateDepartments
      Rails.logger.info "Executing: parseDepartments at #{Time.now}"
      filename = File.join(Rails.root, 'parser/html/departments.html')
      url = "http://novasis.villanova.edu/pls/bannerprd/bvckgens.p_proc_term_date?p_calling_proc=bvckschd.p_disp_dyn_sched&p_term=#{Term.schedulr_term.code}&search_option=D"
      
      departments = {}
      Department.all.each{|department| departments[department.code] = department}
      
      data = download(url, filename, false, true)
      data = Hpricot(data)
      (data/'select#subj_id option').each do |option|
        code = option.attributes['value']
        unless departments[code] || code == '%'
          Rails.logger.debug "inserting #{departments[code]}"
          Department.new({:code => code, :name => option.inner_text}).save
        end
      end 
    end
  end
end