class UserController < ApplicationController
  require 'ldap.rb'
  
  before_filter :validate_disclaimer, :only => [:on_login]
  
  def login
    session[:user] = nil
  end
  
  def on_login
    email = params[:person][:email]
    password = params[:person][:password]
    
    if email.blank? || password.blank? || password == nil
      flash[:warning] = 'Both an email and a password are required.'
      render :action => 'login'
    else
      person = LDAP.new(logger).authenticate(email, password)
      if person
        session[:user] = person.id
        redirect_to '/'
      else
        flash[:warning] = "Your previous login attempt has failed.  You must use your Villanova LDAP username and password."
        render :action => 'login'
      end
    end
  end
  
  def logout
    session[:user] = nil
    flash[:notice] = 'You have been logged out.'
    redirect_to '/user/login'
  end
  
  protected
  def validate_disclaimer
    unless params[:disclaimer] && (params[:disclaimer][:agree] == true || params[:disclaimer][:agree] == '1')
      flash[:warning] = 'You must agree to the disclaimer.'
      render :action => 'login'
    end
  end
end
