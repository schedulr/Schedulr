class ChangeColumnsToText < ActiveRecord::Migration
  def self.up
    change_column :course_sections, :notes, :text
    change_column :course_sections, :comment, :text
    change_column :course_sections, :prerequisites, :text
    change_column :course_sections, :restrictions, :text
  end

  def self.down
    change_column :course_sections, :notes, :string
    change_column :course_sections, :comment, :string
    change_column :course_sections, :prerequisites, :string
    change_column :course_sections, :restrictions, :string
  end
end
