========================
 OpenSlides Development
========================

Check requirements
''''''''''''''''''

- ``docker``
- ``docker-compose``
- ``git``
- ``make``

**Note about migrating from development setups before version 3.4**: You must set the
``OPENSLIDES_USER_DATA_DIR`` variable in your ``server/personal_data/var/settings.py``
to  ``'/app/personal_data/var'``. Another way is to just delete this file. It is
recreated with the right paths afterwards.


Get OpenSlides source code
''''''''''''''''''''''''''

Clone current master version from `OpenSlides GitHub repository
<https://github.com/OpenSlides/OpenSlides/>`_::

    git clone https://github.com/OpenSlides/OpenSlides.git --recurse-submodules
    cd OpenSlides

When updating the repository, submodules must be updated explicitly, too::

    git submodule update

Start the development setup
'''''''''''''''''''''''''''

Use `make` to start the setup::

    make run-dev

All your data (database, config, mediafiles) is stored in ``server/personal_data/var``.
To stop the setup press Ctrl+C. To clean up the docker containers run::

    make stop-dev

Running the test cases
''''''''''''''''''''''

For all services in submodules check out the documentation there.


Server tests and scripts
------------------------

You need to have python (>=3.8) and python-venv installed. Change your workdirectory to the server::

    cd server

Setup an python virtual environment. If you have already done it, you can skip this step::

    python3 -m venv .venv
    source .venv/bin/activate
    pip install -U -r requirements.txt

Make sure you are using the correct python version (e.g. try with explicit minor version: ``python3.8``). Activate it::

    source .venv/bin/activate

To deactivate it type ``deactivate``. Running all tests and linters::

    black openslides/ tests/
    flake8 openslides/ tests/
    mypy openslides/ tests/
    isort -rc openslides/ tests/
    pytest tests/

Client tests
------------

You need `node` and `npm` installed. Change to the client's directory. For the first time, install all dependencies::

    cd client/
    npm install

Run client tests::

    npm test

Fix the code format and lint it with::

    npm run cleanup

To extract translations run::

    npm run extract

Building electron applications
------------

As above, you need `node` and `npm` installed.
Change to the client's directory. For the first time, install all dependencies::

    cd client
    npm install

To test OpenSlides using electron without creating a productive build:

    npm run electron-build-debug &&
    npm run electron-test

This will build the OpenSlides with debug information and mount the build into electron

To create production ready electon packages, build the client in prod mode first.

    npm run build

Use electron builder to create a desktop application for either Windows Linux or macOS.
Electron builder will use the production ready files from `server/openslides/static/`
You can find the build applications under `client/dist/electron-builds`

To create a windows portable ".exe"

    npm run electron-build-win

To create a linux portable .AppImage

    npm run electron-build-lin

To create a macOS (Intel) portable .dmg
(This was not tested because we cannot sign applications for macOS)

    npm run electron-build-mac
