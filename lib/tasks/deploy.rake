desc "Deploys the CSC Site"
task :deploy => :environment do
  require 'utils.rb'
  include Schedulr
  
  directory = "/home/schedulr/#{Rails.env}"
  time = Time.now.to_i
  inplace = ENV['inplace'] == 'true'
  fullDir = inplace ? "#{directory}/current" : "#{directory}/releases/#{time}"
  ssh = sshConnection
  
  if inplace
    ssh.e "cd #{directory}/current && git pull origin master && rm Gemfile.lock"
    ssh.e "cd #{directory}/current && RAILS_ENV=#{Rails.env} rake log:rotate log:clear"
  else
    ssh.e "cd #{directory}/releases && git clone git@github.com:ajpalkovic/Schedulr.git #{time}"
    ssh.e "cp #{directory}/current/config/database.yml #{directory}/releases/#{time}/config/database.yml"
  end
  
  tasks = "db:backup db:migrate "
  tasks += "utils:delete_all_sessions " if ENV['delete_sessions'] == 'true'
  tasks += "compress:assets create_jsfile parse_enrollment"
  ssh.e "cd #{fullDir} && rake RAILS_ENV=#{Rails.env} --trace #{tasks}"
  
  unless inplace
    ssh.e "rm #{directory}/current"
    ssh.e "cd #{directory} && ln -s releases/#{time} current"
  end
  ssh.e "cd #{directory}/current && touch tmp/restart.txt"
  
  God.remote_reboot
end