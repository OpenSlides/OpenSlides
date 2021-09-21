# Integration tests

To test the integration of our OpenSlides services we are using cypress.
There are not too many of them, but they are sufficient tell that our services are properly integrated.

- The client can be accessed
- Authentication works (admin admin can be logged in)
- The backend accepts requests (of some sort)
- The auto update transmits data to the client

(this list is not exhaustive)

## Writing tests and using cypress

To write and execute tests meaningfully, you will want to install cypress locally.
Inside the `/integration` directory, execute

    $ npm install
    $ npm run cypress:open
    (or `make cypress-open` from the main directory) 

The cypress runner will open using electron and executes the tests for you.

## Run in docker and CI

Start OpenSlides (Usually in dev setup). From the main directory run

    $ make run-dev

in the `/integration` just fire

    $ docker-compose build
    $ docker-compose up
    (or `make cypress-docker` from the main directory)

Cypress will run dockered and report errors inside the CLI.
Screenshots and videos of the tests can be found in the `/integration/results` folder.

You can streamline the whole process by using

    $ make run-system-tests

From the main directory.
This can take while, since the docker of OS4 has to be build first.