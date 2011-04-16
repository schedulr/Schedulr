class Random
	
	#returns a random number from 0 - high
	def self.r(high)
	   low = 0
	   m = (high - low) / 2
	   
	   return 0 unless high > low && m > low && m < high    
	
	   u = rand
	
	   if u <= (m-low)/(high-low)
	      r = low+ Math.sqrt(u*(high-low)*(m-low))
	   else
	      r = high - Math.sqrt((1.0-u)*(high-low)*(high-m))
	   end
	   r
	end
end