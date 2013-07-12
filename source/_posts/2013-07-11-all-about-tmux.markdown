---
layout: post
title: "All about Tmux"
date: 2013-07-11 14:03
comments: true
categories: Programming
---


Installation
------------
``` bash
    yum install ncurses-devel

    wget --no-check-certificate https://github.com/downloads/libevent/libevent/libevent-2.0.21-stable.tar.gz
    ./configure && make && make install    
    ln -s /usr/local/lib/libevent-2.0.so.5 /usr/lib64/libevent-2.0.so.5

    wget http://sourceforge.net/projects/tmux/files/tmux/tmux-1.8/tmux-1.8.tar.gz
    ./configure && make && make install
    
    # Download my tmux.conf from gist.github.com
    curl https://gist.github.com/TheWaWaR/5889519/raw/96d183211a899462a923a2dc1532b3490bbdd056/tmux.conf > ~/.tmux.conf

```


Configure Tmux & Bash & Zsh
---------------------------
- In ~/.bashrc

``` bash
    export TERM='xterm-256color'
    export TMUX_SHELL='/usr/local/bin/zsh'
    alias tfg='tmux attach'
``` 

- In ~/.tmux.conf (DO **DOT** edit this file directly)

    set-option -g default-shell $TMUX_SHELL

