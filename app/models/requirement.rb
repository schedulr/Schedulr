# == Schema Info
# Schema version: 20110414032850
#
# Table name: requirements
#
#  id    :integer(4)      not null, primary key
#  rtype :string(255)
#  name  :string(255)

class Requirement < ActiveRecord::Base
  has_and_belongs_to_many :course_sections
end