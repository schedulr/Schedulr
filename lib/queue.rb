module Schedulr
  class ThreadedQueue
    def self.create(&block)
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
      @mutex = Mutex.new
    end
    
    def add(item)
      @mutex.lock
      @queue << item
      @mutex.unlock
    end
    
    def complete
      @stop = true
    end
    
    def createThreads
      1.times do
        @threads << Thread.new do
          while true
            while @queue.length > 0
              @mutex.lock
              item = @queue.shift
              @mutex.unlock
              @block.call(item)
            end
            
            break if @stop
            sleep 0.1
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
      block.call(item)
    end
    
    def complete
    end
  end
end