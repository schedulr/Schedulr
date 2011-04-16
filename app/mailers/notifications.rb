class Notifications < ActionMailer::Base
  default :from => 'schedulr@betterschedulr.com', :to => 'aj.palkovic@gmail.com'
  
  def schedulr_error(exceptions)
  	@exceptions = exceptions
  	mail :subject => "CSC Website Bug Report - Schedulr #{Time.now.to_i}"
  end
  
  def reset_link(user)
    @user = user
    mail :subject => 'Schedulr Password Link', :to => user.email
  end
  
  def bugReport(email, bug, session, subject)
    @email = email
    @bug = bug
    @session = session
    @subject = subject
    
    mail :subject => "#{subject} #{Time.now.to_i}"
  end
  
  def noTerm
    mail :subject => 'No Term!'
  end
  
  def share(schedule, user)
    @schedule = schedule
    @user = user
    mail :to => user.email, :subject => "#{schedule.person.full_name} wants to share a schedule with you."
  end
  
  def share_secret(schedule, email, secret)
    @schedule = schedule
    @secret = secret
    @email = email
    mail :to => email, :subject => "#{schedule.person.full_name} wants to share a schedule with you."
  end
  
  def jserror(errors, user)
    @errors = errors
    @user = user
    mail :subject => "Javascript Errors #{Time.now.to_i}"
  end
end
