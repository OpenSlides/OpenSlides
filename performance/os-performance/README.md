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

To see a list of

```
os-performance -h
```

Example:

```
os-performace -d localhost:8000 -u admin -p secred -n 1000 -t connect
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
"pass".
