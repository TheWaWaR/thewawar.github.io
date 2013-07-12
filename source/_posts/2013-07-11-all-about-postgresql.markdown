---
layout: post
title: "All about Postgresql"
date: 2013-07-11 11:36
comments: true
categories: Programming
---


Installation
------------
>  [Install Postgresql 9.1 server on CentOS 6](https://gist.github.com/bvajda/1296795)

### Additional (after install postgresql 9.1)

``` bash
    service postgresql-9.1 initdb
    export PATH=$PATH:/usr/pgsql-9.1/bin     # For install pgcopy2
    yum install postgresql91-devel
```


Add user
--------
>  [PostgreSQL add or create a user account and grant permission for database](http://www.cyberciti.biz/faq/howto-add-postgresql-user-account/)

### 1. In Shell

``` bash
    # Add a user called *tom*
    adduser tom
    passwd tom
    
    # Change user
    su - postgres

    # Start postgresql client
    psql
```


### 2. Inside Postgresql

``` sql
    CREATE USER tom WITH PASSWORD 'public';
    -- Use this to change password >>> \password tom;
    
    CREATE DATABASE jerry;
    GRANT ALL PRIVILEGES ON DATABASE jerry to tom;
    \q;
```


Authentication issue
--------------------
By default, the authentication method is (`peer` for Unix domain
socket connections AND `ident` for IPV4 local connections), if you
login postgresql server by: 
    psql -d myDB -U kafka -h 127.0.0.1
It will report an error like this:
    psql: FATAL:  Ident authentication failed for user "kafka"

In *pg_hba.conf*, Change all authentication type to `md5` (means by
password that after md5 processed).
>  [Authentication Methods](http://www.postgresql.org/docs/9.1/static/auth-methods.html)

*[Option]* :: In *postgresql.conf* , Change `listen_addresses` from
 `localhost` to `*` so you can connect postgresql from remote host.


Common Helpers 
--------------

### 1. How to import data or scheme from .sql file?
### 2. How to export data or scheme from server?
