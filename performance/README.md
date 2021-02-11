## autoupdate-clients

A golang tool to open many autoupdate connections for one user

## server-clients

A toolset for generating load on the servers

## secrets file

Both tools needs a file with the host and login data. The file ``secrets`` must exists in each subfolder and contains exactly three lines:

1) the host
2) username
3) password

E.g. for the demo instance

    https://demo.openslides.org
    demo
    demo

A http:// or https:// prefix for the host is required. No trailing slash.
