class AddSharing < ActiveRecord::Migration
  def self.up
    create_table :people_schedules, :id => false do |t|
      t.integer :schedule_id
      t.integer :person_id
    end
  end

  def self.down
  end
end
