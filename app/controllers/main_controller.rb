class MainController < ApplicationController
  require 'net/http'
  
  before_filter :check_guest, :except => [:index, :useie, :bugReport, :ie, :jserror]
  before_filter :check_ie, :except => [:useie, :ie, :jserror]
  before_filter :check_login, :except => [:useie, :ie, :jserror]

  def index
    @nav = true
    @schedules = Schedule.all :conditions => ['person_id = ?', logged_in_user.id], :include => [:course_sections]
    @person = logged_in_user
  end
  
  def useie
    cookies['ignore_ie'] = {:value => true, :expires => 1.year.from_now}
    redirect_to :action => 'index'
  end
  
  def jserror
    Notifications.deliver_jserror(params[:errors], session[:user])
    render :text => 'success'
  end
  
  def save_search
    Search.new({:search => params[:searches].join("\n")}).save
    render :text => 'success'
  end
  
  def set_version
    user = logged_in_user
    user.version = params[:version].to_i
    user.save
    render :text => 'success'
  end
  
  def bugReport
    if params[:bug] && !params[:bug].empty?
      Notifications.deliver_bugReport(params[:email], params[:bug], session, 'Bug Report')
      flash[:notice] = 'Bug Report received.  Thank you.'
      redirect_to '/'
    end
  end
  
  def featureRequest
    if params[:bug] && !params[:bug].empty?
      Notifications.deliver_bugReport(params[:email], params[:bug], session, 'Feature Request')
      flash[:notice] = 'Feature Request received.  Thank you.'
      redirect_to '/'
    end
  end
  
  def feedback
    @feedback = Feedback.new
    @feedback.person_id = session[:user].to_i
    @feedback.rating = params[:rating].to_i
    @feedback.use_register = params[:use_register] == 'Yes'
    @feedback.register_feedback = params[:register_feedback]
    @feedback.share_friend = params[:share_friend] == 'Yes'
    @feedback.share_advisor = params[:share_advisor] == 'Yes'
    @feedback.share_feedback = params[:share_feedback]
    @feedback.bugs = params[:bugs]
    @feedback.recommend = params[:recommend] == 'Yes'
    @feedback.prefer_schedulr = params[:prefer_schedulr] == 'Yes'
    @feedback.feedback = params[:feedback]
    @feedback.save
    render :text => 'success'
  end
  
  def su
    user = params[:user].to_i
    if user == 0
      session[:user] = session[:su]
    elsif logged_in_user.admin
      session[:su] = session[:user] if session[:su] == nil
      session[:user] = user
    end
    
    redirect_to '/'
  end
end
