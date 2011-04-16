class CreateCourseSections < ActiveRecord::Migration
  def self.up
    create_table :course_sections do |t|
      t.integer :course_id
      t.integer :term_id
      t.string :section_number
      t.string :crn
      t.string :comment
      t.string :notes
      t.string :restrictions
      t.string :prerequisites
      t.string :enrollment
      t.boolean :full
    end
  end

  def self.down
    drop_table :course_sections
  end
end
