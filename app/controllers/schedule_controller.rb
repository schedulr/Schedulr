class ScheduleController < ApplicationController
  before_filter :check_guest
  before_filter :check_ie
  before_filter :check_login
  before_filter :validate, :except => [:set_state, :unshareWithMe, :share_link, :share_data, :new]
  
  def new
    @schedule = Schedule.new
    @schedule.term = @term
    @schedule.person = logged_in_user
    @schedule.save
    ajax_response :status => 'success', :data => @schedule.id
  end
  
  def update
    @schedule = Schedule.find params[:id], :include => [:course_sections]
    @schedule.name = params[:name]
    
    #get course section objects for each of the courses in the schedule
    courseids = params[:courses].split(',').map{|course| course.to_i}.join(',')
    @courses = CourseSection.all :conditions => "id IN (#{courseids})" if courseids.length > 0
    @courses ||= []
    
    #delete any courses in the saved version that are not in the schedule already
    for course in @schedule.course_sections
      @schedule.course_sections.delete course unless @courses.include? course
    end
    
    #add the courses from the ajax request that are not already in the db
    for course in @courses
      @schedule.course_sections << course unless @schedule.course_sections.include? course
    end
    
    @schedule.save
    ajax_response :status => 'success'
  end
  
  def destroy
    @schedule = Schedule.find params[:id]
    @schedule.destroy
    ActiveRecord::Base.connection.execute "DELETE FROM people_schedules WHERE schedule_id = #{@schedule.id}"
    ActiveRecord::Base.connection.execute "DELETE FROM course_sections_schedules WHERE schedule_id = #{@schedule.id}"
    ActiveRecord::Base.connection.execute "DELETE FROM shares WHERE schedule_id = #{@schedule.id}"
    ajax_response :status => 'success'
  end
  
  def set_state
    user = logged_in_user
    user.state = params[:state]
    user.save
    ajax_response :status => 'success'
  end
  
  def share
    @schedule = Schedule.find params[:id]
    @schedule.share params[:email]
    ajax_response :status => 'success'
  end
  
  def unshare
    @schedule = Schedule.find params[:id]
    @schedule.unshare params[:email]
    ajax_response :status => 'success'
  end
  
  def unshareWithMe
    ActiveRecord::Base.connection.execute "DELETE FROM people_schedules WHERE schedule_id = #{params[:id]} AND person_id = #{logged_in_user.id}"
    ajax_response :status => 'success'
  end
  
  def share_link
    if(Schedule.link_clicked(params[:secret], logged_in_user))
      flash[:notice] = 'Schedule shared.'
    else
      flash[:notice] = 'Schedule not shared.'
    end
    redirect_to '/'
  end
  
  def share_data
    @myShared = Schedule.where(:person_id => session[:user].to_i, :term_id => @term.id).includes(:shares, :people).all
    @sharedWithMe = logged_in_user.shared_schedules.in_term(@term)
    if @sharedWithMe.length > 0
      @sharedWithMe = Schedule.all(:conditions => ["id IN (#{@sharedWithMe.map{|schedule| schedule.id}.join(',')})"], :include => [:person, :course_sections])
    end
    ajax_response({:status => 'success'}, 'share_data')
  end
  
  def add_gcal_id
    @schedule = Schedule.find params[:id]
    @schedule.gcal_id = params[:gcal_id]
    @schedule.save
    ajax_response :status => 'success'
  end
  
  def get_gcal_id
    @schedule = Schedule.find params[:id]
    ajax_response :status => 'success', :data => @schedule.gcal_id
  end
end
