class AdminController < ApplicationController
  require 'net/ssh'
  require 'Deploy.rb'
  require 'utils.rb'
  include Schedulr
  
  before_filter :validate
  
  def index
    if Rails.env == 'production'
      output = sshConnection.exec! "ps -ef | grep rake"
      lines, count = output.split("\n"), 0
      lines.each{|line| count += (line.include? "grep rake") ? 0 : 1 }
      @god = count >= 1
    else
      @god = true
    end
    
    @enrollmentMtime = File.mtime(File.join(Rails.root, 'public/javascripts/generated/enrollment.js'))
    @dataMtime = File.mtime(File.join(Rails.root, 'public/javascripts/generated/data.js'))
    
    @terms = Term.all
  end
  
  def backup
    output = `rake RAILS_ENV=#{Rails.env} db:backup log:rotate log:clear`
    flash[:notice] = "Success<br />Command Output:<br />#{output}"
    redirect_to '/admin'
  end
  
  def parser
    output = `rake RAILS_ENV=#{Rails.env} parse_courses parse_descriptions create_jsfile parse_enrollment --trace &`
    flash[:notice] = "Success<br />Command Output:<br />#{output}"
    redirect_to '/admin'
  end
  
  def reboot_god
    flash[:notice] = God.reboot
    redirect_to '/admin'
  end
  
  def next_term
    term = Term.find params[:id]
    n = term.make_next
    flash[:notice] = "Success #{n.inspect}"
    redirect_to '/admin'
  end
  
  def destroy
    term = Term.find params[:id]
    term.destroy
    flash[:notice] = 'Success'
    redirect_to '/admin'
  end
  
  def active
    ActiveRecord::Base.connection.execute "UPDATE terms SET active = 0"
    term = Term.find params[:id]
    term.active = true
    term.save
    flash[:notice] = 'Success'
    redirect_to '/admin'
  end
  
  def edit_term
    term = Term.find params[:id]
    term.update_attributes params[:term]
    
    flash[:notice] = 'Success'
    redirect_to '/admin'
  end
  
  def admin
    person = Person.find_by_email params[:person][:email]
    if person
      person.admin = true
      flash[:notice] = "#{person.full_name} is an admin."
    else
      flash[:notice] = "Could not find #{params[:person][:email]}"
    end
  end
  
  def empty
    ActiveRecord::Base.connection.execute "DELETE FROM schedules"
    ActiveRecord::Base.connection.execute "DELETE FROM shares"
    ActiveRecord::Base.connection.execute "DELETE FROM people_schedules"
    ActiveRecord::Base.connection.execute "DELETE FROM course_sections_schedules"
    ActiveRecord::Base.connection.execute "DELETE FROM sessions"
    
    if params[:all]
      ActiveRecord::Base.connection.execute "DELETE FROM courses"
      ActiveRecord::Base.connection.execute "DELETE FROM course_sections"
      ActiveRecord::Base.connection.execute "DELETE FROM course_sections_instructors"
      ActiveRecord::Base.connection.execute "DELETE FROM course_section_times"
      ActiveRecord::Base.connection.execute "DELETE FROM mappings"
    end
    
    flash[:notice] = 'Success'
    redirect_to '/admin'
  end
  
  protected
  def validate
    redirect_to '/' unless logged_in_user.admin
  end
end
