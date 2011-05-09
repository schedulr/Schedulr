class RemoveActive < ActiveRecord::Migration
  def self.up
    remove_column :terms, :active
    
    terms = Term.all(:conditions => ['year < ?', 2010])
    termids = terms.map{|term| term.id}.uniq
    
    if termids.length > 0
      sections = CourseSection.where(:term_id => termids).all
      sectionids = sections.map{|section| section.id}.uniq
    
      ActiveRecord::Base.connection.execute "DELETE FROM terms WHERE id IN(#{termids.join(',')})"
      
      if sectionids.length > 0
        ActiveRecord::Base.connection.execute "DELETE FROM course_sections WHERE term_id IN (#{termids.join(',')})"
        ActiveRecord::Base.connection.execute "DELETE FROM course_sections_schedules WHERE course_section_id IN(#{sectionids.join(',')})"
        ActiveRecord::Base.connection.execute "DELETE FROM course_sections_requirements WHERE course_section_id IN(#{sectionids.join(',')})"
        ActiveRecord::Base.connection.execute "DELETE FROM course_section_times WHERE course_section_id IN(#{sectionids.join(',')})"
        ActiveRecord::Base.connection.execute "DELETE FROM course_sections_instructors WHERE course_section_id IN(#{sectionids.join(',')})"
      end
    end
  end

  def self.down
    add_column :terms, :active, :boolean, :default => false
  end
end
