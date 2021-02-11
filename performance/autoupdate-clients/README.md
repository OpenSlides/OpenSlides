## needs go>15

Setup:

    go build
    ./autoupdate-clients 10

The first argument is the amount of clients (100 is the default)

TODOS:
- Pressing Ctrl+C during connecting should stop the process immediatly
- Show progress of connecting clients
- Use some kind of connect-rate - it seems that using e.g. 1000 connections take some time and results in errors.
