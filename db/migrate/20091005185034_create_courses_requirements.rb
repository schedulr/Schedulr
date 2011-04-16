class CreateCoursesRequirements < ActiveRecord::Migration
  def self.up
    create_table :course_sections_requirements, :id => false do |t|
      t.integer :course_section_id
      t.integer :requirement_id
    end
  end

  def self.down
    drop_table :course_sections_requirements
  end
end
