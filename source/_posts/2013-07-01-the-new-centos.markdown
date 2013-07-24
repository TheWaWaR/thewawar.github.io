---
layout: post
title: "The new CentOS"
date: 2013-07-01 12:39
comments: true
categories: Programming
---
  
Initialization
==============

### 1. Download the mini version of CentOS-6.4 ISO file.

### 2. Configure yum
  Just use the default(centos.ustc.edu.cn). So, nothing to do ~

### 3. Install some important packages

    yum upgrade
    yum groupinstall "Development Tools"
    yum install wget bzip2 unzip zip man 
    
Time spend: [21:17-21:40] 25min, 400kb/s



<!-- more -->


Install base packages
=====================

From other articles
-------------------
### 1. Install tmux
### 2. Install emacs
### 3. Install postgresql
### 4. Update Git & Configure GitHub


Install Python2.7
-----------------
>  [How to install Python 2.7 and 3.3 on CentOS 6](http://toomuchdata.com/2012/06/25/how-to-install-python-2-7-3-on-centos-6-2/)

### 1. Install Python itself

    yum install zlib-devel bzip2-devel openssl-devel ncurses-devel sqlite-devel readline-devel tk-devel
    wget http://python.org/ftp/python/2.7.5/Python-2.7.5.tar.bz2
    tar xf Python-2.7.5.tar.bz2
    cd Python-2.7.5
    ./configure --prefix=/usr/local
    make && make altinstall


### 2. Install pip

    wget --no-check-certificate https://pypi.python.org/packages/source/s/setuptools/setuptools-0.7.4.tar.gz
    wget --no-check-certificate https://pypi.python.org/packages/source/p/pip/pip-1.3.1.tar.gz
    # Install them by the given order

    # Edit *~/.pip/pip.conf* and add this:
    [global]
    index-url=http://pypi.v2ex.com/simple

    pip install ipython virtualenv pyflakes


    
Install Zsh
-----------

    wget http://sourceforge.net/projects/zsh/files/zsh/5.0.2/zsh-5.0.2.tar.bz2
    wget http://sourceforge.net/projects/zsh/files/zsh-doc/5.0.2/zsh-5.0.2-doc.tar.bz2
    tar xf zsh-5.0.2.tar.bz2
    tar xf zsh-5.0.2-doc.tar.bz2
    cd zsh-5.0.2
    ./configure && make && make install
    
    # Config zsh
    curl -L https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh | sh
    curl https://gist.github.com/TheWaWaR/28291f8fb326bbdfe714/raw/87a8f1bddec42d94f93e2d851e39ad6cf4e0ef48/.zshrc > ~/.zshrc


  
Install Ruby
------------
### 1. Standard Rbenv Installation

    cd
    git clone git://github.com/sstephenson/rbenv.git .rbenv
    echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.zshenv
    echo 'eval "$(rbenv init -)"' >> ~/.zshenv
    git clone git://github.com/sstephenson/ruby-build.git ~/.rbenv/plugins/ruby-build
    source ~/.zshenv

    
### 2. Install Ruby 1.9.3

    rbenv install 1.9.3-p194
    rbenv rehash
    # Fix by https://github.com/sstephenson/rbenv/issues/73
    rbenv global 1.9.3-p194

    
Install JDK6
------------

    # Upload jdk-6u45-linux-x64-rpm.bin
    chmod u+x jdk-6u45-linux-x64-rpm.bin
    ./jdk-6u45-linux-x64-rpm.bin


    
Configure Dropbox
-----------------
> [Install dropbox on your Linux Server](https://www.dropbox.com/install?os=lnx)

> [Using Dropbox from command line on your Linux Server](http://www.techpage3.com/2013/01/using-dropbox-from-command-line-on-your.html)

    cd ~ && wget -O - "https://www.dropbox.com/download?plat=lnx.x86_64" | tar xzf -
    ~/.dropbox-dist/dropboxd &
    

 FAQ 
=====

### 1. How to let dhclient(or other service) autostart ?
> [Configure Linux DHCP client ( dhclient ) to persistently look for an IP address lease](http://www.cyberciti.biz/faq/rhel-centos-configure-persistent-dhcp-client/)

    ... [HOLD] ...
    
### 2. tree 乱码

    yum remove tree
    wget http://mama.indstate.edu/users/ice/tree/src/tree-1.6.0.tgz
    tar zxvf tree-1.6.0.tgz
    make && make install    
    

### 3. Goagent

    curl -L https://github.com/goagent/goagent/archive/3.0.zip > goagent-3.0.zip
    unzip goagent-3.0.zip
    # Edit *proxy.ini* change *appid* to *weet-proxy*
    python2.7 proxy.py

    
> Created at: [2013-06-29 12:45]
  
