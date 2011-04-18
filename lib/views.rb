
#This code generates a single javascript file containing all of the views.
#To do this, it has to compress and encode the views so they are valid, single line, javascript strings.
#It scans the whole public directory looking for any haml files and adds those files plus aliases to the file that do not including the file extension for instance.

def compressViews
  data = combineViews
  filename = File.join(Rails.root, 'public/javascripts/generated', "hamlViewFiles.js")
  FileUtils.touch(filename)
  File.open(filename, 'w+') do |file|
    file.write data
  end
end

def combineViews
  root = File.join Rails.root, 'public'
  viewStrings = []

  files = enumerateDirectories root
  for file in files
    obj = File.join root, file
    text = File.new(obj).readlines.map{|line| line.chomp }.join('\\n').gsub("'", "\\\\'")
    names = enumerateNames(file)
    
    viewStrings << [text, names]
  end

  lines = ["var text;"]
  viewStrings.each do |view|
    lines << "text = '#{view[0]}';"
    for name in view[1]
      lines << "$.Views.add('#{name}', text);"
    end
  end
  
  lines.join("\n")
end

def removeSlash(file)
	file = file[1..-1] if file[0..0] == '/'
end

def removeExtension(file)
	bits = file.split('/')
	bits[-1] = bits[-1].split('.')[0]
	file = bits.join('/')
end

def enumerateNames(file)
  names = [file, removeExtension(file), removeSlash(removeExtension(file))]
  
  simpleName = file.split('/').map{|bit| ['view', 'views', 'javascripts'].include?(bit) ? nil : bit}.compact.join('/')
  unless simpleName == file
    names << simpleName
    names << removeExtension(simpleName)
    names << removeSlash(removeExtension(simpleName))
  end
  names
end

def enumerateDirectories(root)
  files = [], directories = ['/views']
  
  while directories.size > 0
    file = directories.pop
    obj = File.join root, file
    next if file.include? 'hamlTest'
    if File.directory? obj
      Dir.entries(obj).each do |dir| 
        directories.push file+'/'+dir unless ['.svn', '.', '..'].include? dir
      end
    else
      files << file
    end
  end
  
  files[2..-1]
end