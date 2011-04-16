class CreateCourses < ActiveRecord::Migration
  def self.up
    create_table :courses do |t|
      t.integer :department_id
      t.integer :number
      t.string :title
      t.string :courseid
    end
  end

  def self.down
    drop_table :courses
  end
end
