class AddVersion < ActiveRecord::Migration
  def self.up
    add_column :people, :version, :integer, :default => 0
  end

  def self.down
  end
end
