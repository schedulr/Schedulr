require 'test_helper'

class RequirementTest < ActiveSupport::TestCase
  # Replace this with your real tests.
  test "the truth" do
    assert true
  end
end

# == Schema Info
# Schema version: 20110414032850
#
# Table name: requirements
#
#  id    :integer(4)      not null, primary key
#  rtype :string(255)
#  name  :string(255)