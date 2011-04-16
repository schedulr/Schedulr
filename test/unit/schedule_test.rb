require 'test_helper'

class ScheduleTest < ActiveSupport::TestCase
  # Replace this with your real tests.
  test "the truth" do
    assert true
  end
end

# == Schema Info
# Schema version: 20110414032850
#
# Table name: schedules
#
#  id        :integer(4)      not null, primary key
#  person_id :integer(4)
#  name      :string(255)     default("")
#  gcal_id   :string(255)