class AddScheduleName < ActiveRecord::Migration
  def self.up
  	add_column :schedules, :name, :string, :default => ''
  end

  def self.down
  	remove_column :schedules, :name
  end
end
