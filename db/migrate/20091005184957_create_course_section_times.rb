class CreateCourseSectionTimes < ActiveRecord::Migration
  def self.up
    create_table :course_section_times do |t|
      t.integer :course_section_id
      t.integer :start_hour
      t.integer :start_minute
      t.integer :day
      t.integer :end_hour
      t.integer :end_minute
      t.string :location
    end
  end

  def self.down
    drop_table :course_section_times
  end
end
