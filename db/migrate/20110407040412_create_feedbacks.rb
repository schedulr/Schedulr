class CreateFeedbacks < ActiveRecord::Migration
  def self.up
    create_table :feedbacks do |t|
      t.integer :rating
      t.integer :person_id
      t.boolean :use_register
      t.text :register_feedback
      t.boolean :share_friend
      t.boolean :share_advisor
      t.text :share_feedback
      t.text :bugs
      t.boolean :recommend
      t.boolean :prefer_schedulr
      t.text :feedback

      t.timestamps
    end
  end

  def self.down
    drop_table :feedbacks
  end
end
