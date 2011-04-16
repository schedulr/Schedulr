class CreateSchedules < ActiveRecord::Migration
  def self.up
    create_table :schedules do |t|
      t.integer :user_id
    end
    
    create_table :course_sections_schedules, :id => false do |t|
      t.integer :course_section_id
      t.integer :schedule_id
    end
  end

  def self.down
    drop_table :schedules
    drop_table :course_sections_schedules
  end
end
