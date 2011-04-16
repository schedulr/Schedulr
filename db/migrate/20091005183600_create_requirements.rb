class CreateRequirements < ActiveRecord::Migration
  def self.up
    create_table :requirements do |t|
      t.string :rtype
      t.string :name
    end
  end

  def self.down
    drop_table :requirements
  end
end
