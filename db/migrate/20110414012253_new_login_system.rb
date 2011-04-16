class NewLoginSystem < ActiveRecord::Migration
  def self.up
    add_column :people, :secret, :string, :default => nil
    add_column :people, :salt, :string, :default => nil
    add_column :people, :password, :string, :default => nil
  end

  def self.down
    remove_column :people, :secret
    remove_column :people, :salt
    remove_column :people, :password
  end
end
