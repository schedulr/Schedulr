class AddScheduleTerm < ActiveRecord::Migration
  def self.up
    add_column :schedules, :term_id, :integer
  end

  def self.down
  end
end
