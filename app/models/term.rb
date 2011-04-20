# == Schema Info
# Schema version: 20110414032850
#
# Table name: terms
#
#  id         :integer(4)      not null, primary key
#  code       :string(255)
#  year       :string(255)
#  semester   :string(255)
#  start_date :date
#  end_date   :date
#  active     :boolean(1)

class Term < ActiveRecord::Base
  #the name in this case is just the semester and year.  it does not distinguish between summer sessions
  def name
    "#{semester} #{year}"
  end
  
  #returns the name of the semester along with the specific summer session if applicable
  def full_name
    name
  end
  
  def self.by_year
    terms = Term.order(:code).all
    dict = {}
    terms.each {|term| (dict[term.year] ||= []) << term}
    
    dict
  end
  
  def self.create_from_parser(semester, year, code)
    return nil if semester == 'Summer' # this can be added later, but I'm not parsing Novasis' summer session format
    term = Term.new :semester => semester, :year => year.to_i, :code => code, :active => false
    previousTerm = Term.find_by_year_and_semester(semester, term.year-1)
    previousTerm = Term.find_by_semester(semester) unless previousTerm
    
    term.start_date = Date.civil(term.year, previousTerm.start_date.month, previousTerm.start_date.day)
    term.end_date = Date.civil(term.year, previousTerm.end_date.month, previousTerm.end_date.day)
    
    term.save
  end
  
  #returns every term in the database that we have course schedule information for
  def self.available_terms
    self.find :all, :conditions => ['section_info = ?', 'available'], :group => 'semester, year', :order => 'id DESC'
  end
  
  #returns the term that we are currently in
  def self.current_term
    today = Date.today
    self.find :first, :conditions => ['start_date <= ? AND end_date >= ?', today, today]
  end
  
  #returns the term that is used for registration purposes
  def self.schedulr_term(force=false)
    term = self.where(:active => true).first
    return term if term
    
    term = self.current_term
    if force || 60.days.since(term.start_date) <= Date.today
      nextYear, nextSemester = term.year.to_i, 'Fall'
      nextYear, nextSemester = term.year.to_i+1, 'Spring' if term.semester == 'Fall'
      term = self.first :conditions => ['year = ? AND semester = ?', nextYear, nextSemester]
    end
    term
  end
  
  # inserts the term that follows this term by making a copy of the previous
  def make_next
    next_term = Term.new
    nextYear, nextSemester = year.to_i, 'Fall'
    nextYear, nextSemester = year.to_i+1, 'Spring' if semester == 'Fall'
    
    existing_term = Term.where(['year = ? AND semester = ?', nextYear, nextSemester]).first
    return if existing_term
    
    previous_term = Term.where(['year = ? AND semester = ?', nextYear-1, nextSemester]).first
    
    next_term.start_date = previous_term.start_date+1.year
    next_term.end_date = previous_term.end_date+1.year
    next_term.year = nextYear
    next_term.semester = nextSemester
    next_term.active = false
    
    if nextSemester == 'Fall'
      next_term.code = "#{next_term.year.to_i+1}20"
    else
      next_term.code = "#{next_term.year}30"
    end
    
    next_term.save
    
    next_term
  end
end