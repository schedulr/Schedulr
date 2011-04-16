class AddDescription < ActiveRecord::Migration
  def self.up
    add_column :courses, :description, :text
    add_column :courses, :credits, :string
  end

  def self.down
  end
end
