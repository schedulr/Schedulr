require 'test_helper'

class CourseSectionTest < ActiveSupport::TestCase
  # Replace this with your real tests.
  test "the truth" do
    assert true
  end
end

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