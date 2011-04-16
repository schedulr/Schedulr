require 'test_helper'

class DepartmentTest < ActiveSupport::TestCase
  # Replace this with your real tests.
  test "the truth" do
    assert true
  end
end

# == Schema Info
# Schema version: 20110414032850
#
# Table name: departments
#
#  id   :integer(4)      not null, primary key
#  code :string(255)
#  name :string(255)