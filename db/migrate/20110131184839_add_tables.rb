class AddTables < ActiveRecord::Migration
  def self.up
    create_table :terms do |t|
      t.string :termid
      t.string :code
      t.string :year
      t.string :semester
      t.date :start_date
      t.date :end_date
    end
    
    create_table :people do |t|
      t.string :email
      t.string :firstname
      t.string :lastname
      t.string :middleinitial
      t.string :suffix
      t.string :nickname
      t.string :nickname_use
      t.string :salutation
      t.string :primary_email
      t.string :secondary_email
      t.string :website_url
      t.string :birth_date
      t.string :spousename
      t.string :villanova_uid
      t.string :major
      t.string :year
      t.string :college
      t.boolean :viewed_message
    end
  end

  def self.down
  end
end
