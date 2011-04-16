class AddGcalColumn < ActiveRecord::Migration
  def self.up
    add_column :schedules, :gcal_id, :string
  end

  def self.down
    remove_column :schedules, :gcal_id
  end
end
