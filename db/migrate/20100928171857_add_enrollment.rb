class AddEnrollment < ActiveRecord::Migration
  def self.up
    remove_column :course_sections, :enrollment
    add_column :course_sections, :enrolled, :integer, :default => 0
    add_column :course_sections, :capacity, :integer, :default => 0
  end

  def self.down
  end
end
