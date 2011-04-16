class CreateCourseSectionsInstructors < ActiveRecord::Migration
  def self.up
    create_table :course_sections_instructors, :id => false do |t|
      t.integer :course_section_id
      t.integer :instructor_id
    end
  end

  def self.down
    drop_table :course_sections_instructors
  end
end
