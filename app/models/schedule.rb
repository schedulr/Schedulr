# == Schema Info
# Schema version: 20110414032850
#
# Table name: schedules
#
#  id        :integer(4)      not null, primary key
#  person_id :integer(4)
#  name      :string(255)     default("")
#  gcal_id   :string(255)

class Schedule < ActiveRecord::Base
  belongs_to :person
  has_and_belongs_to_many :course_sections
  has_and_belongs_to_many :people
  has_many :shares
  
  def share(email)
    person = Person.find_by_email(email)
    unless person
      mapping = Mapping.find_by_email(email)
      person = mapping.person if mapping
    end
      
    if person
      unless person.shared_schedules.include? self
        person.shared_schedules << self
        Notifications.deliver_share(self, person)
      end
    else
      secret = ''
      20.times { secret += (rand(16)+10).to_s(36).upcase }
      share = Share.new({:email => email, :schedule_id => id, :secret => secret})
      share.save
      Notifications.deliver_share_secret(self, email, secret)
    end
  end
  
  def unshare(email)
    share = Share.where(:email => email, :schedule_id => id).first
    if share
      share.destroy
    else
      person = Person.find_by_email email
      if person
        ActiveRecord::Base.connection.execute "DELETE FROM people_schedules WHERE schedule_id = #{id} AND person_id = #{person.id}"
      end
    end
  end
  
  def unshareWithMe(person)
    ActiveRecord::Base.connection.execute "DELETE FROM people_schedules WHERE schedule_id = #{id} AND person_id = #{person.id}"
  end
  
  def self.link_clicked(secret, person)
    share = Share.find_by_secret(secret)
    return unless share
    
    shares = Share.find_all_by_email share.email
    for emailShare in shares
      ActiveRecord::Base.connection.execute "DELETE FROM people_schedules WHERE schedule_id = #{emailShare.schedule_id} AND person_id = #{person.id}"
      ActiveRecord::Base.connection.execute "INSERT INTO people_schedules(schedule_id, person_id) VALUES(#{emailShare.schedule_id}, #{person.id})"
    end
    
    person.save
    share.destroy
    Mapping.new({:email => share.email, :person_id => person.id}).save
    
    true
  end
end