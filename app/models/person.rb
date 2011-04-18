# == Schema Info
# Schema version: 20110414032850
#
# Table name: people
#
#  id             :integer(4)      not null, primary key
#  email          :string(255)
#  firstname      :string(255)
#  lastname       :string(255)
#  viewed_message :boolean(1)      not null
#  admin          :boolean(1)
#  version        :integer(4)      default(0)
#  state          :text
#  secret         :string(255)
#  salt           :string(255)
#  password       :string(255)

class Person < ActiveRecord::Base
  require 'digest/sha2'
  
  has_many :schedules
  has_and_belongs_to_many :shared_schedules, :class_name => 'Schedule'
  has_many :mappings
  
  validates_presence_of :firstname, :lastname, :email
  validates_uniqueness_of :email
  
  def reset_password
    self.salt = nil
    self.password = nil
    
    self.secret = create_secret
    save
    
    begin
      Notifications.deliver_reset_link(self)
    rescue
      return false
    end
    
    return true
  end
  
  def change_password(password)
    #create a new salt any time the password is changed
    self.salt = create_salt
    self.password = Person.encrypt_password(password, salt)
    self.secret = nil
    save
  end
  
  def self.valid_password(password, confirmation)
    #for now, just validates they are the same
    #password strength can be added later
    return password == confirmation
  end
  
  def self.authenticate(email, password)
    return nil if email == nil || password == nil
    
    person = Person.find_by_email(email)
    return nil unless person
    
    password = Person.encrypt_password(password, person.salt)
    return person if person.password == password
  end
  
  def self.encrypt_password(password, salt)
    # all password are combined with a user-specific, randomly generated salt
    password = "#{password}#{salt}"
    
    # hasing multiples times makes it more difficult to generate rainbow tables
    1000.times do
      password = Digest::SHA2.hexdigest(password)
    end
    
    password
  end
  
  def create_salt
    random_string(10)
  end
  
  def create_secret
    random_string(40)
  end
  
  def random_string(count)
    letters = %w{a b c d e f g h i j k l m n o p q r s t u v w x y z 0 1 2 3 4 5 6 7 8 9}
    str = ''
    
    count.times do
      str += letters[rand(letters.length).to_i]
    end
    
    str
  end
  
  def full_name
    "#{firstname} #{lastname}"
  end
end