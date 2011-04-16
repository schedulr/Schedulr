require 'test_helper'
class MainControllerTest < ActionController::TestCase
  
  def test_index
  	test_all %w{index contact about mission}
  end
  
  def test_login
    unset_logged_in_user
    puts "LDAP Username:"
    username = STDIN.gets
    
    puts "LDAP Password:"
    password = STDIN.gets
    
    run_for_redirect :post, :login, {:username => username, :password => password}
    assert_equal Person.find(session[:user]), @person
    run_for_redirect :post, :logout
  end
end
