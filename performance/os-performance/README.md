# OpenSlides performace

Tool to test the limits of OpenSlides.

## Install

### With installed go.

```
go get github.com/OpenSlides/OpenSlides/performance/os-performance
```

### Wich checked out repo

```
go build
```


## Run

You can see the usage of the command by calling it.

```
os-performance
```

Example:

```
os-performace connect -d localhost:8000 -u admin -p admin -a 100
```

## Test cases

### Simulate many browsers

```
os-performace -u admin -p secred -n 1000 -t browser
```

This test simulates, that 1000 browser tabs are opend at the same time. Each
browser starts by login in. After that, it creates requests to whoami, login,
constants and servertime at the same time.


## Sumulate many autoupdate connections

```
os-performace -u admin -p secred -n 1000 -t connect
```

This test opens 1000 autoupdate connections and shows, when they receive an
update.


## Create dummy users

```
os-performance -u admin -p secred -n 1000 create_users
```

This creates 1.000 users with the names dummy1, dummy2 etc and the password
"pass". All users are present and in the group with id 3 (delegates).


## Votes

```
os-performance -t votes -n 1000
```

Sends 1.000 votes with differnt user. Make sure the users are created with
`create_users` so they have the correct names and passwords. Make also sure,
there is a poll in the correct state.
