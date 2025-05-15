cd ./openslides-$1
git remote rename origin upstream
git remote add origin git@github.com:Janmtbehrens/openslides-$1.git
git fetch upstream
git remote -v
cd ..