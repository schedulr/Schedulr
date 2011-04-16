while true; do
  cd /home/schedulr/production/current
  rake RAILS_ENV=production god --trace
done
