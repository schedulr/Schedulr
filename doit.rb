=begin
def doit
  CourseSection.all.each do |section|
    next unless section.prerequisites
    str = section.prerequisites.downcase.gsub(/[a-z]{2,4}\s*[0-9]{3,5}\s*(concurrency:\s*(yes|no))?/, "")
    puts section.course.courseid, section.prerequisites if str.match(/(and\s+or)|(or\s+and)/)
  end
  return nil
end

def doit2(str)
  courses = []
  str.downcase.gsub(/[a-z]{2,4}\s*[0-9]{3,5}\s*(concurrency:\s*(yes|no))?/) do |match|
    courses << match
    "#{courses.length-1} "
  end
end

( 0 and  1 ) or ( 2 and  3 or  4 or 7) and ( 5 or  6 )
=end

class Node
  attr_accessor :children, :str
  def initialize(str, *args)
    @str, @children = str, args
    if @children && @children.length > 1 && @children[0].str == @str
      @children = @children[0].children.concat [@children[1]]
    end
  end
  
  def &(other)
    Node.new('and', self, other)
  end
  
  def |(other)
    Node.new('or', self, other)
  end
  
  def doit(depth)
    print "#{'| '*depth}#{@str}\n"
    @children.each{|child| child.doit(depth+1)}
  end
end

node = (Node.new('0') & Node.new('1')) | (Node.new('2') & Node.new('3') | Node.new('4') | Node.new('7')) & (Node.new('5') | Node.new('6'))
node.doit(0)


def doit3(str)
  str = str.downcase.gsub(/([a-z]{2,4}\s*[0-9]{3,5}\s*(?:concurrency:\s*(?:yes|no))?)/) {|match| "Node.new('#{match}') "}
  str = str.gsub('and', '&').gsub('or', '|')
  puts str
  node = eval(str)
  node.doit(0)
end

doit3('( VSB 2020 and  VSB 2010) or ( MGT 1102 and  ACC 1101 or  HON 1101) and ( FIN 1113 or  HON 1113)')
doit3('( MGT 1102 and  DIT 1141 or  MGT 1141 or  HON 1141 or  VSB 3008) and ( FIN 1113 or  HON 1113) and ( MKT 1137 or HON 1137) or ( VSB 2006 and  VSB 2007 and  VSB 3006 and  VSB 3008 and  VSB 2010 and  VSB 2020 and  ECO 3108 or  ECO 3109)')