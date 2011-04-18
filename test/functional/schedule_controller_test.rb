require 'test_helper'

class ScheduleControllerTest < ActionController::TestCase
  test "un-logged in users" do
    [:new, :update, :destroy, :set_state, :share, :unshare, :unshareWithMe, :share_link, :share_data, :add_gcal_id, :get_gcal_id].each do |action|
      check_login action
    end
  end
  
  test "bad schedule ids do not throw exceptions" do
    get_success :update, {:id => 'forty-two'}, {:user => people(:person1).id}
    assert @response.body == 'Schedule not found.'
  end
  
  test "owned schedule validation" do
    get_success :new, {}, {:user => people(:person1).id}
    schedule = Schedule.first.id
    
    [:update, :destroy, :share, :unshare, :add_gcal_id, :get_gcal_id].each do |action|
      get_success action, {:id => schedule}, {:user => people(:person2).id}
      assert @response.body == 'Not Authorized'
    end
  end
  
  test "updating a schedule" do
    get_success :new, {}, {:user => people(:person1).id}
    schedule = Schedule.first
    
    doUpdate = Proc.new do |courses|
      ajax_success :update, {:id => schedule.id, :courses => courses.join(',')}, {:user => people(:person1).id}
    end
    
    doUpdate.call([])
    assert schedule.course_sections.count == 0
    
    doUpdate.call([course_sections(:section1).id])
    assert schedule.course_sections.count == 1
    
    # test adding a duplicate course
    doUpdate.call([course_sections(:section1).id, course_sections(:section1).id])
    assert schedule.course_sections.count == 1
    
    doUpdate.call([course_sections(:section1).id, course_sections(:section2).id])
    assert schedule.course_sections.count == 2
    ids = schedule.course_sections.map{|section| section.id}
    assert ids.include? course_sections(:section1).id
    assert ids.include? course_sections(:section2).id
  end
  
  test "gcal id is set properly" do
    get_success :new, {}, {:user => people(:person1).id}
    schedule = Schedule.first
    
    get_success :get_gcal_id, {:id => schedule.id}, {:user => people(:person1).id}
    assert @response.body == 'nil'
    
    ajax_success :add_gcal_id, {:id => schedule.id, :gcal_id => '42'}, {:user => people(:person1).id}
    get_success :get_gcal_id, {:id => schedule.id}, {:user => people(:person1).id}
    assert @response.body == '42'
  end
  
  test "sharing" do
    get_success :new, {}, {:user => people(:person1).id}
    schedule = Schedule.first
    assert schedule.people.length == 0
    
    ajax_success :share, {:id => schedule.id, :email => people(:person2).email}, {:user => people(:person1).id}
    assert schedule.people.count == 1
    
    # ensure double sharing is not possible
    ajax_success :share, {:id => schedule.id, :email => people(:person2).email}, {:user => people(:person1).id}
    assert schedule.people.count == 1
    
    # ensure sharing with self is not possible
    ajax_success :share, {:id => schedule.id, :email => people(:person1).email}, {:user => people(:person1).id}
    assert schedule.people.count == 1
    
    # test unsharing
    ajax_success :unshare, {:id => schedule.id, :email => people(:person2).email}, {:user => people(:person1).id}
    assert schedule.people.count == 0
    
    ajax_success :unshare, {:id => schedule.id, :email => people(:person2).email}, {:user => people(:person1).id}
    assert schedule.people.count == 0
  end
  
  test "mappings" do
    get_success :new, {}, {:user => people(:person1).id}
    get_success :new, {}, {:user => people(:person1).id}
    
    schedule1 = Schedule.first
    schedule2 = Schedule.last
    
    ajax_success :share, {:id => schedule1.id, :email => 'user1'}, {:user => people(:person1).id}
    ajax_success :share, {:id => schedule2.id, :email => 'user1'}, {:user => people(:person1).id}
    ajax_success :share, {:id => schedule1.id, :email => 'user2'}, {:user => people(:person1).id}
    
    assert Mapping.count == 0
    assert Share.count == 3
    
    # test that the secret links correctly shares the schedule and updates the correct share/mapping objects
    share = Share.first
    get_redirect :share_link, {:secret => share.secret}, {:user => people(:person2).id}
    
    assert Mapping.count == 1
    assert Share.count == 1
    assert schedule1.people.count == 1
    assert schedule2.people.count == 1
    
    # prevent duplicate shares
    share = Share.first
    get_redirect :share_link, {:secret => share.secret}, {:user => people(:person2).id}
    
    assert Mapping.count == 2
    assert Share.count == 0
    assert schedule1.people.count == 1
    assert schedule2.people.count == 1
  end
end
