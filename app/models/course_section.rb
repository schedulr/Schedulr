# == Schema Info
# Schema version: 20110414032850
#
# Table name: course_sections
#
#  id             :integer(4)      not null, primary key
#  course_id      :integer(4)
#  term_id        :integer(4)
#  section_number :string(255)
#  crn            :string(255)
#  comment        :string(255)
#  notes          :string(255)
#  restrictions   :string(255)
#  prerequisites  :string(255)
#  full           :boolean(1)
#  enrolled       :integer(4)      default(0)
#  capacity       :integer(4)      default(0)
#  title          :string(255)

class CourseSection < ActiveRecord::Base
  belongs_to :course
  belongs_to :term
  
  has_and_belongs_to_many :instructors
  has_and_belongs_to_many :requirements
  has_many :course_section_times, :dependent => :destroy
  
  DAYS = %w{M T W R F S U}
  
  def full_destroy
    ActiveRecord::Base.connection.execute "DELETE FROM course_sections_schedules WHERE course_section_id = #{id}"
    ActiveRecord::Base.connection.execute "DELETE FROM course_sections_instructors WHERE course_section_id = #{id}"
    ActiveRecord::Base.connection.execute "DELETE FROM course_sections_requirements WHERE course_section_id = #{id}"
    self.destroy
  end
  
  # returns the section times as a string
  def to_s
    if course_section_times.length > 0
      times = course_section_times.map{|time| time.to_s}
      times2 = []
    
      for time in times
        good = true
        for time2 in times2
          if time[0] == time2[0]
            time2[1] += time[1]
            good = false
            break
          end
        end
        times2 << time if good
      end
    
      times2.map{|time| time.join(' ')}.join('<br />')
    else
      'TBA'
    end
  end
  
  def mapDays
  	course_section_times.map{|time| time.day}.uniq.sort
  end
  
  def days
    course_section_times.length > 0 ? mapDays.map{|day| DAYS[day]}.join('') : 'TBA'
  end
  
  def daysSort
    course_section_times.length > 0 ? mapDays.join('') : '0'
  end
end