# == Schema Info
# Schema version: 20110414032850
#
# Table name: searches
#
#  id         :integer(4)      not null, primary key
#  search     :text
#  created_at :datetime
#  updated_at :datetime

class Search < ActiveRecord::Base
end