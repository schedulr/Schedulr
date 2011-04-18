# Methods added to this helper will be available to all templates in the application.
module ApplicationHelper
  
  def print_boolean(value)
    value || value == 1 ? 'Yes' : 'No'
  end

  def partial(template, locals={})
    render :partial => template, :locals => locals
  end
  
  def escape_xml(str)
    m = {'>' => '&gt;', '<' => '&lt;', "'" => '&apos;', '"' => '&quot;', '&' => '&amp;'}
    (str || '').to_s.gsub(/[&<>\'\"]/) {|match| m[match]}
  end
end
