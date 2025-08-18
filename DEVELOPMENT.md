# Development of OpenSlides 4

## Requirements

You need `git`, `bash`, `docker`, `docker compose` (v2), `make` and `openssl` installed.

`go` is needed to install https://github.com/FiloSottile/mkcert (but it is not a requirement to start the development server). The development setup uses HTTPS per default. OpenSlides does not work with HTTP anymore since features are required (like http2) that only work in a secure environment.

## Before starting the development

Clone this repository:

    $ git clone --recurse-submodules git@github.com:OpenSlides/OpenSlides.git

After cloning you need to initialize all submodules:

    $ git submodule update --init

Finally, start the development server:

    $ make run-dev

(This command won't run without sudo, or without having set up Docker to run without sudo - see their documentation)

You can access the services independently using their corresponding ports
or access the full stack on

    $ https://localhost:8000

Login as admin with ´admin´ as both username and password.

## Running tests

To run all tests of all services, execute `run-service-tests`.

## Translations

Since multiple services (currently: client and backend) make use of translation files, the
functionality for this is bundled in this repository. The following make commands are available:

-   `make extract-translations`: Extracts all strings which need translations from all services and
    merges them together into a single `template-en-pot`, which is placed under `i18n/`. You must
    run `make run-dev` in another terminal before you can execute this command.
-   `make push-translations`: Push the current template file under `i18n/template-en.pot` to Transifex
    to allow translating it there.
-   `make pull-translations`: Pull the translations in all languages available in the client from
    Transifex and place them in `i18n/`. Copy them into the respective translation folders of all
    required services.

### Setting up Transifex

The use of the latter two commands requires you to set up the [Transifex
CLI](https://developers.transifex.com/docs/cli). Following is a short installation manual for
version 1.6.6, which may or may not work for future versions. If in doubt, consult the Transifex
docs.

Execute the following command:

```bash
curl -o- https://raw.githubusercontent.com/transifex/cli/master/install.sh | bash -s -- v1.6.6
```

To identify to Transifex with the CLI, you have to provide a `.transifexrc` file in your home path:

```
[https://www.transifex.com]
rest_hostname = https://rest.api.transifex.com
token         = API_TOKEN_HERE
```

Replace `API_TOKEN_HERE` with your API token, which you can generate under
https://app.transifex.com/user/settings/api/. Now you should be able to execute the commands above.

### Translation workflow

1. After you made some changes, run `make extract-translations` to update the template file.
1. Run `make push-translations` to push your changes to Transifex.
1. Translate the new strings on Transifex.
1. When you are done, run `make pull-translations` to fetch the new translation files.
1. Create a pull request in all affected repositories.

### Adding new languages

`make pull-translations` only pulls the translation files which are available in the client by
calling `npm run get-available-translations` inside the client container. If you want to add a new
language, you must also change the list of available languages in the client to make it available to
pull via these scripts.

## Adding a new Service

    $ git submodule add <git@myrepo.git>

Append `branch = main` to the new entry in the `.gitmodules` file. Verify,
that it is there (the folder should have 160000 permissions: Submodule) with the
current commit:

    $ git diff --cached

Then, commit changes and create a pull request.

## Work in submodules

Create your own fork at github.

Remove the upstream repo as the origin in the submodule:

    $ cd <submodule>
    $ git remote remove origin

Add your fork and the main repo as origin and upstream

    $ git remote add origin `<your fork>`
    $ git remote add upstream `<main repo>`
    $ git fetch --all
    $ git checkout origin main

You can verify that your setup is correct using

    $ git remote -v

The output should be similar to

    origin    git@github.com:<GithubUsername>/OpenSlides.git (fetch)
    origin	  git@github.com:<GithubUsername>/OpenSlides.git (push)
    upstream  git@github.com:OpenSlides/OpenSlides.git (fetch)
    upstream  git@github.com:OpenSlides/OpenSlides.git (push)

## Requirements for services

### Environment variables

These environment variables are available:

-   `<SERVICE>_HOST`: The host from a required service
-   `<SERVICE>_PORT`: The port from a required service

Required services can be `MESSAGE_BUS`, `DATASTORE_WRITER`, `PERMISSION`, `AUTOUPDATE`,
etc. For private services (e.g. a database dedicated to exactly one service),
use the following syntax: `<SERVICE>_<PRIV_SERVICE>_<ATTRIBUTE>`, e.g. the
database user for the media-service: `MEDIA_DATABASE_USER`.

### Makefile

A makefile must be provided at the root-level of the service. The currently
required (phony) targets are:

-   `run-tests`: Execute all tests from the submodule
-   `build-dev`: Build an image with the tag `openslides-<service>-dev`

### Build arguments in the Dockerfile

These build arguments should be supported by every service:

-   `REPOSITORY_URL`: The git-url for the repository to use
-   `GIT_CHECKOUT`: A branch/tag/commit to check out during the build

Note that meaningful defaults should be provided in the Dockerfile.

## Developing on a single service

Go to the service and create a new branch (from main):

    $ cd my-service
    $ git status  # -> on main?
    $ git checkout -b my-feature

Run OpenSlides in development mode (e.g. in a new terminal):

    $ make run-dev

After making some changes in my-service, create a commit and push to your fork

    $ git add -A
    $ git commit -m "A meaningful commit message here"
    $ git push origin -u my-feature

As the last step, you can create a PR on Github. After merging, these steps are
required to be executed in the main repo:

    $ cd my-service
    $ git pull upstream main
    $ cd ..
    $ git diff  # -> commit hash changed for my-service

If the update commit should be a PR:

    $ git checkout -b updated-my-service
    $ git commit -am "Updated my-service"
    $ git push origin updated-my-service

Or a direct push on main:

    $ git commit -am "Updated my-service"
    $ git push origin main

## Working with Submodules

After working in many services with different branches, this command checks
out `main` (or the given branch in the .gitmodules) in all submodules and
pulls main from upstream (This requires to have `upstream` set up as a remote
in all submodules):

    $ git submodule foreach -q --recursive 'git checkout $(git config -f $toplevel/.gitmodules submodule.$name.branch || echo main); git pull upstream $(git config -f $toplevel/.gitmodules submodule.$name.branch || echo main)'

This command can also be called from the makefile using:

    $ make services-to-main

When changing the branch in the main repo (this one), the submodules do not
automatically get changed. This command checks out all submodules to the given
commits in the main repo:

    $ git submodule update

## Working with the backend

Sometimes it might be helpful to be able to run tests in the backend console and the frontend in
parallel. To circumvent the need to restart the full stack every time you switch contexts, there
exist the `docker/docker-compose.test.yml` which introduces another database container to the stack.

By default (meaning by running `make run-dev`), the setup uses the normal `postgres` container. We
call this the `dev` context. By executing `make switch-to-test`, you can replace the database
container and automatically restarting all dependent services, thus changing into the so-called
`test` context. With `make switch-to-dev`, you can switch back. Finally, `make run-backend` provides
a shortcut to switch to the `test` context and enter the backend shell to e.g. execute tests there.
Be aware that all these commands need an OpenSlides instance to be already running, meaning you have
to execute `make run-dev` first.

## Helper scripts

See [README](dev/scripts/README.md) in the scripts folder.
