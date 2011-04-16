class RenameUser < ActiveRecord::Migration
  def self.up
    rename_column :schedules, :user_id, :person_id
  end

  def self.down
  end
end
