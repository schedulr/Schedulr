require 'socket'
require 'net/sftp'

module Schedulr
  EXCEPTIONS = []
  
  def getSettings
    YAML.load_file(File.join(Rails.root, 'config/settings.yml'))[Rails.env]
  end
  
  def sshConnection
    require 'net/ssh'
    settings = getSettings
    Net::SSH.start(settings[:domain], settings[:user], :keys => [settings[:sshkey]])
  end
  
  
  def download(url, filename, parse=true, force=false)
    FileUtils.mkdir_p(File.join(Rails.root, 'parser/html'))
    
    if force ||  ENV['use_cache'] != 'true'
      quiet = ENV['quiet'] ? '-q' : ''
      quiet = '-q'
      path = Rails.env == 'production' ? '/usr/bin/' : ''
      cmd = "#{path}wget #{quiet} -O #{filename} -T 1000 \"#{url}\" \n"
      `#{cmd}`
    end
    
    data = File.read(filename)
    return data unless parse
      
    lowerCaseStuff = %w{CLASS <A A> <TR TR> <TD TD> <TH TH> <TABLE TABLE> HREF TITLE NAME TARGET <SELECT SELECT> <OPTION VALUE ID=}
    lowerCaseStuff.each{|attribute| data = data.gsub(attribute, attribute.downcase)}
    data.gsub("A&B;", "A&amp;B;").gsub("&nbsp;", " ")
  end
  
  def threadedLoop(delay, code)
    t = Thread.new do
      infiniteLoop(delay, code)
    end
  end
  
  def infiniteLoop(delay, code)
    while true
      handleErrors do
        code.call
      end
      Rails.logger.flush
      sleep delay
    end
  end
  
  def handleErrors
    if Rails.env == 'development' || ENV['print_errors'] == 'true'
      yield
    else
      begin
        yield
      rescue Exception => e
        print "#{e}\n"
        Rails.logger.error e
        
        begin
          Notifications.deliver_schedulr_error [e] unless Rails.env == 'development'
        rescue
          Rails.logger.error "ERROR EMAILING ERROR"
        end

        begin      
          output =  "#{'!'*80}\nException:\n#{e.inspect}\n"
          output += e.backtrace.join("\n")
        
          Rails.logger.error output
        rescue
          Rails.logger.error "ERROR LOGGING ERROR\n"
        end
      end
    end
    Rails.logger.flush
  end
end
