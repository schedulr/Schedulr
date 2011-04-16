ActionMailer::Base.raise_delivery_errors = true
ActionMailer::Base.perform_deliveries = true

ActionMailer::Base.smtp_settings = {
  :address => "localhost",
  :domain => "betterschedulr.com",
  :port => 25
}
