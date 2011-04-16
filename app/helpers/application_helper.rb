# Methods added to this helper will be available to all templates in the application.
module ApplicationHelper
  
  def print_boolean(value)
    value || value == 1 ? 'Yes' : 'No'
  end
  
  def random_image (gallery)
    gal = Gallery.find gallery
    image = Random.r gal.images.size
    gal.images[image]
  end
  
  def random_image_tag (gallery)
    image = random_image gallery
    "<img src='#{image.image_url}' alt='#{image.alt_text}' class='#{image.image_type}' />"
  end
  
  def word_substring(string, length=150)
    string = strip_tags(string).strip()[0..length]
    while string.strip.length == string.length && length > 0
      length -= 1
      string = string[0..length]
    end
    string
  end
  
  def table_row(th_column, td_column, hide_blank_column=true)
    table_row2(true, th_column, td_column) unless td_column.blank? && hide_blank_column
  end
  
  def table_row2(th=false, *columns)
    "<tr>#{table_columns(th, columns)}</tr>"	
  end
  
  def table_columns(th=false, *columns)
  	columns = columns.flatten
    ret = ''
    for column in columns
      tag = th ? 'th' : 'td'
      ret += "<#{tag}>#{column}</#{tag}>"
      th = false
    end
    ret
  end

  def dlist_row(th_column, td_column, hide_blank_column=true)
    "<dt>#{th_column}</dt><dd>#{td_column}</dd>" unless td_column.blank? && hide_blank_column
  end

  def partial(template, locals={})
    render :partial => template, :locals => locals
  end
end
