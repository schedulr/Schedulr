ENV["RAILS_ENV"] = "test"
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

class ActiveSupport::TestCase
  # Setup all fixtures in test/fixtures/*.(yml|csv) for all tests in alphabetical order.
  #
  # Note: You'll currently still have to declare fixtures explicitly in integration tests
  # -- they do not yet inherit this setting
  fixtures :all

  # Add more helper methods to be used by all tests here...
  def check_login(action, params=nil)
    get action, params
    assert_response :redirect
    assert_redirected_to :controller => 'user', :action => 'login'
  end
  
  def get_success(*args)
    get *args
    assert_response :success
  end
  
  def get_redirect(*args)
    get *args
    assert_response :redirect
  end
end