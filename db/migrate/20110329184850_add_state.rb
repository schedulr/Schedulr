class AddState < ActiveRecord::Migration
  def self.up
    add_column :people, :state, :text
  end

  def self.down
  end
end
