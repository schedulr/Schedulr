namespace :compress do
  desc 'Compresses the css and javascript files.'
  task :assets => :environment do
    require 'compressor.rb'
    require 'views.rb'
    compressSchedulr
    Rails.logger.flush
  end
end