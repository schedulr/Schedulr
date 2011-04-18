# == Schema Info
# Schema version: 20110414032850
#
# Table name: courses
#
#  id            :integer(4)      not null, primary key
#  department_id :integer(4)
#  number        :integer(4)
#  courseid      :string(255)
#  description   :text
#  credits       :string(255)

class Course < ActiveRecord::Base
  belongs_to :department
  has_many :course_sections
end