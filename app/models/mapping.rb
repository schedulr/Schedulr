# == Schema Info
# Schema version: 20110414032850
#
# Table name: mappings
#
#  id         :integer(4)      not null, primary key
#  email      :string(255)
#  person_id  :integer(4)
#  created_at :datetime
#  updated_at :datetime

class Mapping < ActiveRecord::Base
  belongs_to :person
end