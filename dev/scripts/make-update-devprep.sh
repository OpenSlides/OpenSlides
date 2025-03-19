#!/bin/bash

# This file contains helpful oneliners for working on make-update.sh.
# Uncomment lines as needed, edit <PLACEHOLDERS> and execute.
# I strongly recommend cloning OpenSlides into a seperate local folder for
# working on make-update.sh .


### Intitial dev-setup

# While working on make-update.sh it is helpful to have your own forks acting
# like the live repo.
# These lines will setup origin as your forks and oorigin as the live repo for
# reference (and resetting).
# Possibly existing upstream remotes should be removed
# If remotes exist change `add` to `set-url`

#git submodule foreach --recursive 'git remote set-url origin git@github.com:<GITHUB_USERNAME>/$name.git'
#git remote set-url origin git@github.com:<GITHUB_USERNAME>/OpenSlides.git
#git submodule foreach --recursive 'git remote add oorigin git@github.com:OpenSlides/$name.git'
#git remote add oorigin git@github.com:OpenSlides/OpenSlides.git
#git submodule foreach --recursive 'git remote rm upstream ||:'
#git remote rm upstream ||:

# As running make-update.sh will change your local repository state (including
# running `git reset --hard`) it likely will discard development changes.
# Therefore it is helpful to work on a copy of make-update.sh in order for git
# to not track and therefore not reset it.

#cp -f dev/scripts/make-update.sh dev/scripts/make-update1.sh
#chmod +x dev/scripts/make-update1.sh
#cp -f dev/scripts/make-update-devprep.sh dev/scripts/make-update-devprep1.sh
#chmod +x dev/scripts/make-update-devprep1.sh

# Now changes can be done in make-update1.sh. To execute them run
#   `./dev/scripts/make-update1.sh staging` instead of
#   `make staging-update`


### Regular resetting to live state

# In order to reset local repo and your forks to the state of the live repo we
# can fetch oorigin, reset to it and force-push to origin
# Pay close attention that origin remote urls are set correctly (pointing to
# your forks, see above) in order not to accidentially push into live repo.

# main branch
#git submodule foreach --recursive git fetch --no-recurse-submodules oorigin main
#git submodule foreach --recursive git checkout -B main oorigin/main
#read -p 'confirm force-push to origin [ENTER] ' && git submodule foreach --recursive git push -f origin main
#git fetch --no-recurse-submodules oorigin main
#git checkout -B main oorigin/main
#read -p 'confirm force-push to origin [ENTER] ' && git push -f origin main

# staging branch
#git submodule foreach --recursive git fetch --no-recurse-submodules oorigin staging/4.<X>.<X>
#git submodule foreach --recursive git checkout -B staging/4.<X>.<X> oorigin/staging/4.<X>.<X>
#read -p 'confirm force-push to origin [ENTER] ' && git submodule foreach --recursive git push -f origin staging/4.<X>.<X>
#git fetch --no-recurse-submodules oorigin staging/4.<X>.<X>
#git checkout -B staging/4.<X>.<X> oorigin/staging/4.<X>.<X>
#read -p 'confirm force-push to origin [ENTER] ' && git push -f origin staging/4.<X>.<X>

# stable branch
#git submodule foreach --recursive git fetch --no-recurse-submodules oorigin stable/4.2.x
#git submodule foreach --recursive git checkout -B stable/4.2.x oorigin/stable/4.2.x
#read -p 'confirm force-push to origin [ENTER] ' && git submodule foreach --recursive git push -f origin stable/4.2.x
#git fetch --no-recurse-submodules oorigin stable/4.2.x
#git checkout -B stable/4.2.x oorigin/stable/4.2.x
#read -p 'confirm force-push to origin [ENTER] ' && git push -f origin stable/4.2.x


### Verifying

# Look at all submodules git graphs one by one.
#git submodule foreach --recursive 'echo $name ; sleep 1 ; git log --date-order --all --oneline --graph ||:'
