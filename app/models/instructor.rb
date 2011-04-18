# == Schema Info
# Schema version: 20110414032850
#
# Table name: instructors
#
#  id    :integer(4)      not null, primary key
#  name  :string(255)
#  email :string(255)

class Instructor < ActiveRecord::Base
  has_and_belongs_to_many :course_sections
  
  # used for sorting instructors by last name
  def sortName
    bits = name.split(/\s+/)
    return bits[0] if bits.length == 1
    "#{bits[-1]}, #{bits[0..-2].join(' ')}"
  end
end