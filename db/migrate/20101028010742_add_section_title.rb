class AddSectionTitle < ActiveRecord::Migration
  def self.up
    add_column :course_sections, :title, :string
    remove_column :courses, :title
  end

  def self.down
    remove_column :course_sections, :title
    add_column :courses, :title, :string
  end
end
