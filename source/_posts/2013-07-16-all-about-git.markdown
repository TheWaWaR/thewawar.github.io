---
layout: post
title: "All about Git"
date: 2013-07-16 11:42
comments: true
categories: 
---


Update Git [1.7.1 ==> 1.8]
--------------------------

    yum remove git
    yum install perl-CPAN curl-devel
    
    wget https://git-core.googlecode.com/files/git-1.8.3.2.tar.gz
    tar -zxvf git-1.8.3.2.tar.gz
    cd git-1.8.3.2
    ./configure && make && make install

    # Install man pages
    tar xzv -C /usr/local/share/man -f git-manpages-1.8.3.2.tar.gz

    
Configure GitHub
----------------

    cd ~/.ssh
    ssh-kengen
    # Copy *id_rsa.pub* to *SSH Keys* @github.com



 FAQ
----
### 1. Checkout/Push a remote branch
> [Git how to create remote branch](http://stackoverflow.com/questions/1519006/git-how-to-create-remote-branch)

    # Checkout
    git fetch 
    git checkout -b origin origin/learn

    # Push
    git push --set-upstream origin learn

    
### 2. Checkout a branch by tag

    git checkout -b  [NEW-BRANCH-NAME]  [TAG-NAME]
