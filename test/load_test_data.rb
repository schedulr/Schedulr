require File.dirname(__FILE__) +'/test_helper.rb'

class LoadTestData < Test::Unit::TestCase
  	models = %w{actions actions_people actions_workgroups addresses administrations advising_teams advising_teams_faculty assistant_applications assistant_assignments assistants colleges colloquia committee_members committees controllers course_section_times course_sections course_textbooks courses courses_programs departments educations exit_interviews faculty faculty_services faculty_specialties faculty_textbooks galleries galleries_images gradis_projects images inductees mastheads news objectives office_hours opportunities organizations people people_roles people_workgroups phone_numbers programs quotes roles specialties staffs summer_employments tech_reports terms textbooks vics_applications workgroups course_feedback_terms coordinator_feedbacks instructor_feedbacks front_page_messages}
  	models.each {|model| fixtures model}
  def setup
  end
  
  def test_nothing
    assert true
  end
end