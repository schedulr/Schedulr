require 'test_helper'

class ShareTest < ActiveSupport::TestCase
  # Replace this with your real tests.
  test "the truth" do
    assert true
  end
end

# == Schema Info
# Schema version: 20110414032850
#
# Table name: shares
#
#  id          :integer(4)      not null, primary key
#  email       :string(255)
#  schedule_id :integer(4)
#  secret      :string(255)
#  created_at  :datetime
#  updated_at  :datetime