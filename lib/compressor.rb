require 'utils.rb'
def compress_files(files, asset_type, extension, prefix='')
  compressor_dir = "#{Rails.root}/lib/compressors/"
  tmp_file = "#{Rails.root}/tmp/#{prefix}_#{asset_type}_uncompressed.#{extension}"
  public_file = File.join("#{Rails.root}/public/#{asset_type}", prefix, "#{asset_type}.#{extension}")

  # write out to a temp file
  FileUtils.mkdir_p File.join("#{Rails.root}/public/#{asset_type}", prefix)
  FileUtils.touch public_file
  File.open(tmp_file, "w") do |f|
    dict, data = merged_file(files, asset_type, extension)
    dict = dict.map{|data| "{name: '#{data[0]}', line: #{data[1]}}"}.join(',')
    f.write("window.stackTraceTable = [#{dict}];\n") if asset_type == 'javascripts'
    f.write(data)
  end
  
  if asset_type == 'javascripts'
    #`java -jar #{compressor_dir}closure.jar --js=#{tmp_file} --js_output_file=#{public_file} \n`
    #`java -jar #{compressor_dir}yui.jar --type js -o "#{public_file}" "#{tmp_file}" \n`
    # closure no longer compresses teh js correctly, so is disabled
    # compressing led to bad stack traces so it is disabled
    `cp "#{tmp_file}" "#{public_file}"\n`
  else
    #`cd "#{compressor_dir}" && java CSSMin "#{tmp_file}" "#{public_file}" \n`
    # CSSMin disabled the gradients in chrome so CSS is no longer minified
    `cd "#{compressor_dir}" && cp "#{tmp_file}" "#{public_file}" \n`  
  end
  
  public_file
end

def merged_file(files, asset_type, extension)
  dict = []
  public_dir = "#{Rails.root}/public/#{asset_type}/"
  merged_file = ""
  
  files.each do |s|
    name = "#{public_dir}#{s}.#{extension}"
    name = File.join(Rails.root, 'public', s) if s[0..0] == '/'
    
    contents = File.new(name).read
    contents.force_encoding("UTF-8").encode!
    
    dict <<  [s, contents.count("\n")+1]
    File.open(name, "r") do |f| 
      merged_file += contents + "\n" 
    end
  end
  
  return dict, merged_file
end

def compressSchedulr
  include Schedulr
  
  stylesheets = ['reset', 'aristo', 'main', 'dropShadow', 'drilldown', 'schedule', 'shadowbox', 'messages', 'messagesImpl']
  javascripts = ['external/jquery', 'baseExtensions', 'external/base', 'external/string', 'jQueryExtensions', 'config', 'production', 'external/shadowbox', 'haml2', 'views', 'external/cookie', 'stacktrace', 'messages', 'dates', 'conflictDialog', 'schedule', 'sharedSchedule', 'scheduleManager', 'gcalManager', 'timeSelectManager',  'drilldownFilters', 'drilldown', 'help', 'search', 'enrollment', 'registerDialog', 'feedback', 'tooltips', 'drilldownFiltersImpl', 'application']

  `sass --update public/stylesheets/sass:public/stylesheets`
  
  js = compress_files javascripts, 'javascripts', 'js', 'generated'
  sheet = compress_files stylesheets, 'stylesheets', 'css', ''
  
  content = ''
  File.open(sheet, 'r') {|f| content += f.read}
  File.open(sheet, 'w+') {|f| f.write content}
  
  File.open(js, 'r') {|f| content = f.read+"\n\n"+combineViews}
  File.open(js, 'w+') {|f| f.write content}
end
