require File.dirname(__FILE__) + '/../test_helper'

class TermTest < Test::Unit::TestCase
  fixtures :terms

  # Replace this with your real tests.
  def test_truth
    assert true
  end
end

# == Schema Info
# Schema version: 20110414032850
#
# Table name: terms
#
#  id         :integer(4)      not null, primary key
#  termid     :string(255)
#  code       :string(255)
#  year       :string(255)
#  semester   :string(255)
#  start_date :date
#  end_date   :date
#  active     :boolean(1)