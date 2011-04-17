namespace :log do
  desc "Rotates the log files"
  task :rotate => :environment do
    log_directory = File.join(Rails.root, 'log')
    backup_directory = File.join(log_directory, "backups/#{Time.now.to_i}")
    
    FileUtils.mkdir_p backup_directory
    `cp #{log_directory}/*.log #{backup_directory}`
    Rails.logger.flush
  end
end  

namespace :utils do
  desc "Deletes all sessions that are older than 1 day."
  task :delete_sessions => :environment do
    ActiveRecord::Base.establish_connection(Rails.env)
    ActiveRecord::Base.connection.execute "DELETE FROM sessions WHERE updated_at < '#{1.day.ago.to_s(:db)}'"
    Rails.logger.flush
  end
  
  desc "Deletes all sessions"
  task :delete_all_sessions => :environment do
    ActiveRecord::Base.establish_connection(Rails.env)
    ActiveRecord::Base.connection.execute "DELETE FROM sessions"
    Rails.logger.flush
  end
end

namespace :db do
  desc 'Backup the Database'
  task :backup => :environment do
    dir = File.join Rails.root, 'db/backup'
    file = File.join dir, "#{Time.now.to_i}.sql.gz"
    
    FileUtils.mkdir_p dir
    config = YAML::load(open(File.join(Rails.root, 'config/database.yml')))[Rails.env]
    cmd = "/usr/bin/mysqldump -u #{config['username']} -p#{config['password']} #{config['database']} | gzip -cf9 > #{file}" 
    `#{cmd}`
    Rails.logger.flush
  end
end

desc 'Reboot God'
task :reboot_god => :environment do
  require 'god.rb'
  puts Schedulr::God.reboot
end