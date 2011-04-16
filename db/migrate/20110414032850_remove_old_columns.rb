class RemoveOldColumns < ActiveRecord::Migration
  def self.up
    #These are all unused columns left over from when Schedulr was integrated in the CSC site
    remove_column :people, :villanova_uid
    remove_column :people, :major
    remove_column :people, :year
    remove_column :people, :college
    remove_column :people, :middleinitial
    remove_column :people, :suffix
    remove_column :people, :nickname
    remove_column :people, :nickname_use
    remove_column :people, :salutation
    remove_column :people, :primary_email
    remove_column :people, :secondary_email
    remove_column :people, :website_url
    remove_column :people, :birth_date
    remove_column :people, :spousename
  end

  def self.down
  end
end
