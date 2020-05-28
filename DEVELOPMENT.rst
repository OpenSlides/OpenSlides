========================
 OpenSlides Development
========================

Check requirements
'''''''''''''''''''''

- ``docker``
- ``docker-compose``
- ``git``
- ``make``

Note about migrating from previous OpenSlides3 development
setups: You must set the ``OPENSLIDES_USER_DATA_DIR`` variable in
your ``server/personal_data/var/settings.py`` to  ``'/app/personal_data/var'``


Get OpenSlides source code
'''''''''''''''''''''''''''''

Clone current master version from `OpenSlides GitHub repository
<https://github.com/OpenSlides/OpenSlides/>`_::

    git clone https://github.com/OpenSlides/OpenSlides.git
    cd OpenSlides

TODO: submodules.

Start the development setup
''''''''''''''''''''''''''''''

    make run-dev


All you data (database, config, mediafiles) is stored in ``server/personal_data/var``.

Running the test cases
-------------------------

For all services in submodules check out the documentation there.

Server tests andscripts
'''''''''''''''''''''''
You need to have python (>=3.8) and python-venv installed. Change your workdirectory to the server::

    cd server

Setup an python virtual environment. If you have already done it, you can skip this step:

    python3 -m venv .venv
    source .venv/bin/activate
    pip install -U -r requirements.txt

Make sure you are using the correct python version (e.g. try with explicit minor version: ``python3.8``). Activate it::

    source .venv/bin/activate

To deactivate it type ``deactivate``. Running all tests and linters:

    black openslides/ tests/
    flake8 openslides/ tests/
    mypy openslides/ tests/
    isort -rc openslides/ tests/
    pytest tests/

Client tests
''''''''''''
You need `node` and `npm` installed. Change to the client's directory. For the first time, install all dependencies::

    cd client/
    npm install

Run client tests::

    npm test

Fix the code format and lint it with::

    npm run cleanup

To extract translations run::

    npm run extract
