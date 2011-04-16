class UserController < ApplicationController
  before_filter :validate_disclaimer, :only => [:on_register, :on_login, :on_reset]
  
  def login
    session[:user] = nil
  end
  
  def on_register
    person = Person.find_by_email params[:person][:email]
    if person
      flash[:warning] = 'This email address has already been registered with Schedulr.  Please login or change your password instead.'
      render :action => 'login'
    else
      person = Person.new params[:person]
      
      if person.valid?
        person.reset_password
        person.save
        redirect_to :action => 'registered'
      else
        flash[:warning] = 'All of the registration form fields are required.'
        render :action => 'login'
      end
    end
  end
  
  def on_login
    email = params[:person][:email]
    password = params[:person][:password]
    
    if email.blank? || password.blank? || password == nil
      flash[:warning] = 'Both an email and a password are required.'
      render :action => 'login'
    else
      person = Person.authenticate(email, password)
      if person
        session[:user] = person.id
        redirect_to '/'
      else
        flash[:warning] = "Your previous login attempt has failed.<br />If you have not used Schedulr before, you may need to register instead.<br />If you have used Schedulr before, be sure to use the username-format of your email, such as apalko01@villanova.edu, not alex.palkovic@villanova.edu."
        render :action => 'login'
      end
    end
  end
  
  def on_reset
    email = params[:person][:email]
    
    if email.blank?
      flash[:notice] = 'A username is required.'
      render :action => 'login'
    else
      person = Person.find_by_email(email)
      if person && person.reset_password
        redirect_to :action => 'reset'
      else
        flash[:warning] = "A user with that email address was not found.<br />If you have not used Schedulr before, you may need to register instead.  <br />If you have used Schedulr before, be sure to use the username-format of your email, such as apalko01@villanova.edu, not alex.palkovic@villanova.edu."
        render :action => 'login'
      end
    end
  end
  
  def reset_link
    @secret = params[:secret]
    @user = Person.find_by_secret(@secret)
    
    redirect_to :action => 'login' unless @user && @secret
  end
  
  def reset_password
    @secret = params[:secret]
    password = params[:person][:password]
    confirmation = params[:person][:password_confirmation]
    
    @user = Person.find_by_secret(@secret)
    if @user
      if Person.valid_password(password, confirmation)
        @user.change_password(password)
        flash[:notice] = 'Your password has been changed!  Login to use Schedulr.'
        redirect_to :action => 'login'
      else
        flash[:warning] = 'Sorry, your password was invalid.'
        render :action => 'reset_link'
      end
    else
      flash[:warning] = 'A user could not be found with that secret key.  Please try again.'
      render :action => 'login'
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
