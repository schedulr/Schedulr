require 'utils.rb'
require 'net/ssh'
require 'net/sftp'

class God
  include Schedulr
  
  def self.reboot
    self.do_reboot do |cmd|
      `#{cmd}`
    end
  end
  
  def self.remote_reboot
    ssh = sshConnection
    self.do_reboot do |cmd|
      ssh.exec! cmd
    end
  end
  
  def self.do_reboot
    output = yield "ps -ef | grep rake"
    lines, lines2 = output.split("\n"), []
    lines.each{|line| lines2.push(line) unless line.include?("grep rake")}
    return "God is running a job." if lines2.length > 1
    
    match = /([0-9]+)\s+([0-9]+)/.match(lines2[0])
    puts lines2[0]
    puts match[1]
    puts match[2]
    yield "kill -9 #{match[2]}; kill -9 #{match[1]}"
    
    begin 
      timeout(2) do
        yield "/god &"
      end
    rescue Timeout::Error; end
    
    return "god rebooted"
  end
  
  def initialize    
    @nextJob = 0
    
    @jobs = {
      :parser => {
        :execute => Proc.new{startParser},
        :onComplete => Proc.new{scheduleParser},
        :next => nil
      },
      :enrollment => {
        :execute => Proc.new{startEnrollment},
        :next => nil,
        :onComplete => Proc.new{scheduleEnrollment}
      }
    }
    
    scheduleEnrollment
    #scheduleParser
  end
  
  def run
    infiniteLoop 0.1, Proc.new{mainLoop}
  end
  
  def nextJob(job)
    if @activeJob && @activeJob[:onComplete]
      if @activeJob[:onComplete].instance_of? Proc
        @activeJob[:onComplete].call
        @activeJob = nil
      else
        Rails.logger.debug "New job: #{@activeJob[:onComplete]}"
        @activeJob = @jobs[@activeJob[:onComplete]]
      end
    else
      @activeJob = nil
    end
    
    @activeJob = job unless @activeJob
    if @activeJob
      @activeJob[:execute].call
    end
  end
  
  def mainLoop
    if @activeJob
      Rails.logger.debug "Going to next job"
      return nextJob(nil)
    end
    
    @jobs.each do |key, value|
      if value[:next] && value[:next] < Time.now
        Rails.logger.debug "Starting new job #{key}"
        return nextJob(value)
      end
    end
  end
  
  def primeTime
    t = Time.now
    t.hour > 12 && t.hour < 22
  end
  
  def scheduleEnrollment
    offset = primeTime ? 180 : 900
    term = Term.current_term
    offset = 1800 if 70.days.since(term.start_date) > Date.today || 110.days.since(term.start_date) < Date.today
    @jobs[:enrollment][:next] = Time.now + offset
  end
  
  def scheduleParser
    @jobs[:departments][:next] = Time.now + (3600*20)
  end
  
  def startParser
    cmd = "rake RAILS_ENV=#{Rails.env} use_cache=true parse_courses parse_descriptions create_jsfile --trace\n"
    output = `#{cmd}`
    Rails.logger.info "Parser completed at #{Time.now}"
    Rails.logger.debug "#{output}"
  end
  
  def startEnrollment
    cmd = "rake RAILS_ENV=#{Rails.env} parse_enrollment\n"
    output = `#{cmd}`
    Rails.logger.info "Enrollment completed at #{Time.now}"
    Rails.logger.debug "#{output}"
  end
end
