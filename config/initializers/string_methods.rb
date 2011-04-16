class String
  #   "man from the boondocks".titleize # => "Man From The Boondocks"
  def titleize2()
    underscore2.humanize.gsub(/\b('?[a-z])/) { $1.capitalize }
  end

  #   "ActiveRecord".underscore         # => "active_record"
  def underscore2()
    self.to_s.gsub(/::/, '/').
      gsub(/([A-Z]+)([A-Z][a-z])/,'\1_\2').
      gsub(/([a-z\d])([A-Z])/,'\1_\2').
      downcase
  end
end