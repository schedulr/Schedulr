class LDAP
  require 'net/ldap'
  
  def initialize(l)
    @logger = l
  end
  
  #essentially there are three ways a person can be authorized, as a Faculty, as a Staff, or as a Student.  however, students are organized along the capitalized first letter of their first name
  def authenticate(username, password)
    person = find_user('ou=Faculty, ou=Employees', username, password)
    person = find_user('ou=Staff, ou=Employees', username, password) unless person
    person = find_user('ou='+username[0,1].capitalize+', ou=Students', username, password) unless person
    person = find_user('ou=People', username, password) unless person
    if person
      @logger.info "Logged in #{person.full_name} (#{username})"
    else
      @logger.info "Failed to login #{username}"
    end
    person
  end
  
  def find_user (ldap_unit, username, password)
    
    #first we need to try to find the person
    base = 'uid='+username+','+ldap_unit+',o=villanova.edu'
    person = nil
    
    ldap = Net::LDAP.new({
      :host => 'ldap.villanova.edu',
      :port => 389,
      :auth => {
        :method => :simple,
        :username => base,
        :password => password
      }
    })
    
    return unless ldap.bind
    
    result = ldap.get_operation_result
    #Rails.logger.debug result.inspect
    #Rails.logger.debug [ldap_unit, base].inspect
    
    #ldap will return a result even if the person is not found.  basically, a 0 just means that it connected and there were no errors
    if result.code == 0
      
      #in reality we only know if the search succeeded if it gets inside the loop
      ldap.search(:base => base) do |entry|
        #Rails.logger.debug entry.inspect
        @logger.debug "Successfully logged in "+username
        
        #the person was found in ldap, now we're gonna check if they're in our db
        person = Person.find_by_email entry.mail
        person = Person.new unless person
        
        #get the list of attributes that ldap has
        attributes = entry.attribute_names
        
        #set all of the attributes for the person model based on what ldap has
        person.email = entry.mail.first if attributes.include? :mail
        person.firstname = entry.givenname.first if attributes.include? :givenname
        person.lastname = entry.sn.first if attributes.include? :sn
          
        #save all of those changes to the person model
        person.save
      end
    else
      #if the result code was not zero, then there was a problem with ldap
      @logger.debug "Login faild.  Code: "+result.code+"  Message: "+result.message
    end
      
    #finally, return the person model
    person
  end
end