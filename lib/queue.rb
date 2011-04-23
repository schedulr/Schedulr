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
      if ENV['threaded'] == 'true'
        ThreadedQueue.new block
      else
        UnThreadedQueue.new block
      end
    end
  end
  
  class ThreadedQueue    
    def initialize(block)
      @block = block
      @threads = []
    end
    
    def add(item)
      Thread.new{@block.call(item)}
    end
    
    def complete
    end
  end
  
  class ThreadedQueueBroken
    def initialize(block)
      @stop = false
      @block = block
      @queue = []
      @threads = []
      @lock = Mutex.new
      createThreads
    end
    
    def add(item)
      @lock.synchronize do
        @queue << item
      end
    end
    
    def complete
      @stop = true
    end
    
    def handleItem(item)
      item.save!
    end
    
    def createThreads
      Thread.new do
        while true
          if Thread.list.length < 5
            if @queue.length > 0
              @lock.synchronize do
                handleItem(@queue.shift)
              end
            end
              
            break if @stop
          end
          
          sleep 0.1
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