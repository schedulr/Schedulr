module Schedulr
  class ThreadedQueue
    def self.load
      return unless ENV['threaded'] == 'true'
      
      loadDirs = ['lib', 'app/models', 'app/helpers', 'lib/parser', 'lib/javascript']
      for dir in loadDirs
        Dir.glob(File.join(Rails.root, dir, "*.rb")).each do |entry|
          require entry
        end
      end
    end
    
    def self.create(&block)
      # The threaded queue is much faster for the initial parse, but there is little difference for subsequent parses
      # However, it's results are non-deterministic.  Repeating the initial parse on the same data doesn't return
      # the same number of courses, so it is disabled for now.
      return ThreadedQueue.new block
      if ENV['threaded'] == 'true'
        ThreadedQueue.new block
      else
        UnThreadedQueue.new block
      end
    end
    
    def initialize(block)
      @stop = false
      @block = block
      @queue = []
      @threads = []
      @lock = Mutex.new
      @mainThread = Thread.list[0]
      createThreads
    end
    
    def add(item)
      @lock.synchronize do
        @queue << item
      end
    end
    
    def complete
      @stop = true
      for thread in @threads
        thread.join
      end
    end
    
    def handleItem(item)
      item.save!
    end
    
    def createThreads
      config = YAML::load(open(File.join(Rails.root, 'config/database.yml')))[Rails.env]
      (config['pool'].to_i-1).times do
        @threads << Thread.new do
          while true
            if @queue.length > 0
              item = nil
              @lock.synchronize do
                item = @queue.shift
              end
              print "#{@queue.length}\n"
              handleItem(item)
              Thread.pass
            else
              if @stop
                break
              else
                @mainThread.run
              end
            end
          end
        end
      end
    end
  end
  
  class UnThreadedQueue
    def initialize(block)
      @block = block
    end
    
    def add(item)
      @block.call(item)
    end
    
    def complete
    end
  end
end