class AddAdmins < ActiveRecord::Migration
  def self.up
    add_column :people, :admin, :boolean, :default => false
    add_column :terms, :active, :boolean, :default => false
  end

  def self.down
  end
end
