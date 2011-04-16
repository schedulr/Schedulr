require 'test_helper'

class SearchTest < ActiveSupport::TestCase
  # Replace this with your real tests.
  test "the truth" do
    assert true
  end
end

# == Schema Info
# Schema version: 20110414032850
#
# Table name: searches
#
#  id         :integer(4)      not null, primary key
#  person_id  :integer(4)
#  search     :text
#  created_at :datetime
#  updated_at :datetime