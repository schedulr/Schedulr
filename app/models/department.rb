# == Schema Info
# Schema version: 20110414032850
#
# Table name: departments
#
#  id   :integer(4)      not null, primary key
#  code :string(255)
#  name :string(255)

class Department < ActiveRecord::Base
  has_many :courses
end