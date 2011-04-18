# == Schema Info
# Schema version: 20110414032850
#
# Table name: course_section_times
#
#  id                :integer(4)      not null, primary key
#  course_section_id :integer(4)
#  start_hour        :integer(4)
#  start_minute      :integer(4)
#  day               :integer(4)
#  end_hour          :integer(4)
#  end_minute        :integer(4)
#  location          :string(255)

class CourseSectionTime < ActiveRecord::Base
  belongs_to :course_section
  DAYS = %w{M T W R F S U}
  
  def pad(num)
    num ||= 0
    "#{num < 10 ? '0':''}#{num}"
  end

  def to_s
    start_am = start_hour < 12
    shour = start_hour < 13 ? start_hour : start_hour - 12
    end_am = end_hour < 12
    ehour = end_hour < 13 ? end_hour : end_hour - 12
    
    ["#{pad shour}:#{pad start_minute} #{start_am ? 'am' : 'pm'} - #{pad ehour}:#{pad end_minute}", DAYS[day]]
  end
  
  def to_key
    to_s.join(' ')+' '+location
  end
end