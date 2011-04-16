# == Schema Info
# Schema version: 20110414032850
#
# Table name: feedbacks
#
#  id                :integer(4)      not null, primary key
#  rating            :integer(4)
#  person_id         :integer(4)
#  use_register      :boolean(1)
#  register_feedback :text
#  share_friend      :boolean(1)
#  share_advisor     :boolean(1)
#  share_feedback    :text
#  bugs              :text
#  recommend         :boolean(1)
#  prefer_schedulr   :boolean(1)
#  feedback          :text
#  created_at        :datetime
#  updated_at        :datetime

class Feedback < ActiveRecord::Base
end