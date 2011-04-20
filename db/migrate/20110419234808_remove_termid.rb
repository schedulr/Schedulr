class RemoveTermid < ActiveRecord::Migration
  def self.up
    remove_column :terms, :termid
  end

  def self.down
  end
end
