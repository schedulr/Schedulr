namespace :db do
  desc "Add schema information (as comments) to model files"
  task :annotate do
    require "annotate_models.rb"
    AnnotateModels.do_annotations
  end
end
