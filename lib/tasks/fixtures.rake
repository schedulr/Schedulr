require 'find'

namespace :db do
  namespace :fixtures do
    desc 'Dumps all models into fixtures.'
    task :dump => :environment do
      models = []
      Find.find(File.join(Rails.root, '/app/models')) do |path|
        unless File.directory?(path) then models << path.match(/(\w+).rb/)[1] end
      end
      
      models.each do |modelName|
        puts "Dumping model: #{modelName}"
        model = modelName.camelize.constantize
        entries = model.all
        
        formatted, increment = '', 1
        entries.each do |entry|
          formatted += "#{modelName}_#{increment}:\n"
          increment += 1
          
          entry.attributes.each do |column, value|
            value = (value || 'nil').to_s.strip
            formatted += "  "
            
            if value.match(/\n/)
              formatted += "#{column}: |\n"
              formatted += value.split("\n").map{|v| "    #{v}\n"}.join('')
            else
              formatted += "#{column}: #{value}\n"
            end
          end
          
          formatted += "\n"
        end
      
        model_file = File.join(Rails.root, '/test/fixtures/',  modelName.pluralize + '.yml')
        
        File.exists?(model_file) ? File.delete(model_file) : nil
        File.open(model_file, 'w') {|f| f << formatted}
      end
    end
  end
end