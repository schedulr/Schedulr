require File.dirname(__FILE__) + '/../test_helper'

class PersonTest < Test::Unit::TestCase
  fixtures :people

  # Replace this with your real tests.
  def test_truth
    assert true
  end
end

# == Schema Info
# Schema version: 20110414032850
#
# Table name: people
#
#  id             :integer(4)      not null, primary key
#  email          :string(255)
#  firstname      :string(255)
#  lastname       :string(255)
#  viewed_message :boolean(1)      not null
#  admin          :boolean(1)
#  version        :integer(4)      default(0)
#  state          :text
#  secret         :string(255)
#  salt           :string(255)
#  password       :string(255)