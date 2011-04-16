# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  layout 'main'
  
  helper :all # include all helpers, all the time
  
  # this protects from csrf attacks
  # the js code will become much more complicated if this is enabled
  # the effect of this attack is quite minimal because of the nature of Schedulr though
  #protect_from_forgery # See ActionController::RequestForgeryProtection for details
  
  protected
  def check_guest
    if session[:user] && session[:user].to_i < 1
      render :text => ''
      return false
    end
    return true
  end
  
  def validate
    schedule = Schedule.find params[:id]
    return true if schedule && schedule.person_id == session[:user].to_i
    render :text => 'Not Authorized'
    return false
  end
  
  def check_login
    session[:user] = 1 if Rails.env == 'development' && !session[:user]
    session[:user] = -1 if params[:guest]
    if !logged_in
      if request.xhr?
        render :text => 'window.loggedOut && window.loggedOut();'
      else
        redirect_to '/login'
      end
      return false
    end
  end
  
  def check_ie
    return true if cookies['ignore_ie'] || !is_ie
    redirect_to :action => 'ie'
  end
  
  def is_ie
    agent = request.headers['HTTP_USER_AGENT']
    agent && (agent.include?('MSIE 7') || agent.include?('MSIE 6'))
  end
  
  #returns true if the session[:user] thing is not empty
  def logged_in
    logged_in_user != nil
  end
  
  #returns the user model of the current user
  def logged_in_user
    unless @logged_in_user
      if session[:user]
        if session[:user].to_i > 0
          @logged_in_user = Person.find session[:user].to_i
        else
          @logged_in_user = Person.new
        end
      end
    end
    @logged_in_user
  end
end
