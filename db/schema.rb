# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20110414032850) do

  create_table "course_section_times", :force => true do |t|
    t.integer "course_section_id"
    t.integer "start_hour"
    t.integer "start_minute"
    t.integer "day"
    t.integer "end_hour"
    t.integer "end_minute"
    t.string  "location"
  end

  add_index "course_section_times", ["course_section_id"], :name => "course_section_id"

  create_table "course_sections", :force => true do |t|
    t.integer "course_id"
    t.integer "term_id"
    t.string  "section_number"
    t.string  "crn"
    t.string  "comment"
    t.string  "notes"
    t.string  "restrictions"
    t.string  "prerequisites"
    t.boolean "full"
    t.integer "enrolled",       :default => 0
    t.integer "capacity",       :default => 0
    t.string  "title"
  end

  create_table "course_sections_instructors", :id => false, :force => true do |t|
    t.integer "course_section_id"
    t.integer "instructor_id"
  end

  add_index "course_sections_instructors", ["course_section_id", "instructor_id"], :name => "course_section_id"
  add_index "course_sections_instructors", ["instructor_id", "course_section_id"], :name => "instructor_id"

  create_table "course_sections_requirements", :id => false, :force => true do |t|
    t.integer "course_section_id"
    t.integer "requirement_id"
  end

  add_index "course_sections_requirements", ["course_section_id", "requirement_id"], :name => "course_section_id"
  add_index "course_sections_requirements", ["requirement_id", "course_section_id"], :name => "requirement_id"

  create_table "course_sections_schedules", :id => false, :force => true do |t|
    t.integer "course_section_id"
    t.integer "schedule_id"
  end

  add_index "course_sections_schedules", ["course_section_id", "schedule_id"], :name => "course_section_id"
  add_index "course_sections_schedules", ["schedule_id", "course_section_id"], :name => "schedule_id"

  create_table "courses", :force => true do |t|
    t.integer "department_id"
    t.integer "number"
    t.string  "courseid"
    t.text    "description"
    t.string  "credits"
  end

  add_index "courses", ["department_id"], :name => "department_id"

  create_table "departments", :force => true do |t|
    t.string "code"
    t.string "name"
  end

  add_index "departments", ["code"], :name => "code"
  add_index "departments", ["name"], :name => "name"

  create_table "feedbacks", :force => true do |t|
    t.integer  "rating"
    t.integer  "person_id"
    t.boolean  "use_register"
    t.text     "register_feedback"
    t.boolean  "share_friend"
    t.boolean  "share_advisor"
    t.text     "share_feedback"
    t.text     "bugs"
    t.boolean  "recommend"
    t.boolean  "prefer_schedulr"
    t.text     "feedback"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "feedbacks", ["person_id"], :name => "person_id"

  create_table "instructors", :force => true do |t|
    t.string "name"
    t.string "email"
  end

  add_index "instructors", ["name"], :name => "name"

  create_table "mappings", :force => true do |t|
    t.string   "email"
    t.integer  "person_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "mappings", ["email"], :name => "email"

  create_table "people", :force => true do |t|
    t.string  "email"
    t.string  "firstname"
    t.string  "lastname"
    t.boolean "viewed_message", :default => false, :null => false
    t.boolean "admin",          :default => false
    t.integer "version",        :default => 0
    t.text    "state"
    t.string  "secret"
    t.string  "salt"
    t.string  "password"
  end

  create_table "people_schedules", :id => false, :force => true do |t|
    t.integer "schedule_id"
    t.integer "person_id"
  end

  add_index "people_schedules", ["person_id", "schedule_id"], :name => "person_id"
  add_index "people_schedules", ["schedule_id", "person_id"], :name => "schedule_id"

  create_table "requirements", :force => true do |t|
    t.string "rtype"
    t.string "name"
  end

  create_table "schedules", :force => true do |t|
    t.integer "person_id"
    t.string  "name",      :default => ""
    t.string  "gcal_id"
  end

  add_index "schedules", ["person_id"], :name => "user_id"

  create_table "searches", :force => true do |t|
    t.integer  "person_id"
    t.text     "search"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "sessions", :force => true do |t|
    t.string   "session_id", :null => false
    t.text     "data"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "sessions", ["session_id"], :name => "index_sessions_on_session_id"
  add_index "sessions", ["updated_at"], :name => "index_sessions_on_updated_at"

  create_table "shares", :force => true do |t|
    t.string   "email"
    t.integer  "schedule_id"
    t.string   "secret"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "shares", ["schedule_id"], :name => "schedule_id"
  add_index "shares", ["secret"], :name => "secret"

  create_table "terms", :force => true do |t|
    t.string  "termid"
    t.string  "code"
    t.string  "year"
    t.string  "semester"
    t.date    "start_date"
    t.date    "end_date"
    t.boolean "active",     :default => false
  end

end
