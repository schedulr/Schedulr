require 'test_helper'

class MainControllerTest < ActionController::TestCase
  # Replace this with your real tests.
  test "un-logged in users" do
    check_login :index
    check_login :set_version
    check_login :feedback
    check_login :su
  end
  
  test "error reports are sent correctly" do
    get_success :jserror, {:errors => []}
    get_success :jserror, {:errors => []}, {:user => people(:person1).id}
    get_success :jserror, {:errors => {
      :error1 => {
        :message => 'Testing Errors',
        :stacktrace => [
          'line 1',
          'line 2'
        ]
      },
      :error2 => {
        :message => 'Testing Errors',
        :stacktrace => [
          'line 1',
          'line 2'
        ]
      }
    }}
  end
  
  test "bug reports are sent" do
    [:bugReport, :featureRequest].each do |action|
      get_redirect action, {:bug => 'Test Bug'}
      get_redirect action, {:bug => 'Test Bug', :email => 'my email'}
      get_redirect action, {:bug => 'Test Bug', :email => 'my email'}, {:user => people(:person1).id}
    end
  end
  
  test "version and search work" do
    searches = %w{s se sea sear searc search}
    person1 = people(:person1).id
    person2 = people(:person2).id
    
    get_success :save_search, {:searches => []}
    get_success :save_search, {:searches => searches}
    
    get_success :save_search, {:searches => []}, {:user => person1}
    get_success :save_search, {:searches => searches}, {:user => person2}
    
    get_success :set_version, {:version => 1}, {:user => person1}
    get_success :set_version, {:version => '2'}, {:user => person2}
    
    #assert(Person.find(person1).version == 1)
    #assert(Person.find(person2).version == 2)
  end
end
