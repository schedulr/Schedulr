module Net
  module SSH
    module Connection
      class Session
        def e(command)
          puts "Running: #{command}"
          output = exec! command
          puts output if output
        end
      end
    end
  end
end