# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  layout 'main'
  
  helper :all # include all helpers, all the time
  before_filter :load_term
  
  # this protects from csrf attacks
  # the js code will become much more complicated if this is enabled
  # the effect of this attack is quite minimal because of the nature of Schedulr though
  #protect_from_forgery # See ActionController::RequestForgeryProtection for details
  
  protected
  def load_term
    if params[:term_id]
      session[:term] = params[:term_id].to_i
    end
    
    if session[:term]
      @term = Term.find session[:term]
    else
      @term = Term.schedulr_term
    end
  end
  
  def ajax_response(data, partialTemplate=nil)
    @data = data
    @logged_in = logged_in
    @partialTemplate = partialTemplate
    @guest = session[:user] == -1
    
    render :template => '/main/ajax', :layout => false, :content_type => 'text/xml'
  end
  
  def check_guest
    if session[:user] && session[:user].to_i < 1
      ajax_response :status => 'success'
      return false
    end
    return true
  end
  
  def validate
    schedule = Schedule.find_by_id params[:id]
    unless schedule
      ajax_response :status => 'Schedule was not found on the server.'
      return false
    end
    
    return true if schedule && schedule.person_id == session[:user].to_i
    
    ajax_response :status => 'Not Authorized'
    return false
  end
  
  def check_login
    session[:user] = 1 if Rails.env == 'development' && !session[:user]
    session[:user] = -1 if params[:guest]
    if !logged_in
      if request.xhr?
        ajax_response :status => 'loggedOut'
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
    if session[:user]
      if session[:user].to_i < 1
        @logged_in_user = Person.new
      elsif !@logged_in_user || @logged_in_user.id != session[:user].to_i
        @logged_in_user = Person.find session[:user].to_i
      end
    end
    
    @logged_in_user
  end
end
