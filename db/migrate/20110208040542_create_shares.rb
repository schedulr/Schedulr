class CreateShares < ActiveRecord::Migration
  def self.up
    create_table :shares do |t|
      t.string :email
      t.integer :schedule_id
      t.string :secret

      t.timestamps
    end
  end

  def self.down
    drop_table :shares
  end
end
