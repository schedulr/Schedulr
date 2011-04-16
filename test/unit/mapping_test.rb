require 'test_helper'

class MappingTest < ActiveSupport::TestCase
  # Replace this with your real tests.
  test "the truth" do
    assert true
  end
end

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