require 'test_helper'

class CourseSectionTimeTest < ActiveSupport::TestCase
  # Replace this with your real tests.
  test "the truth" do
    assert true
  end
end

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