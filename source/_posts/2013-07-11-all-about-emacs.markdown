---
layout: post
title: "All about Emacs"
date: 2013-07-11 14:01
comments: true
categories: Programming
---


Installation
------------
### Some requirements
 完全放弃折腾, 最多使用自带的vi, 考虑如何以最快的时间在一台主机上配置
 一个趁手的Emacs.

### 1. Install Emacs

    wget http://ftp.gnu.org/gnu/emacs/emacs-24.3.tar.xz
    tar Jxf emacs-24.3.tar.xz
    ./configure --with-x-toolkit=no --with-xpm=no --with-jpeg=no --with-png=no --with-gif=no --with-tiff=no
    make && make install

### 2. Get configuration

    git clone git@github.com:TheWaWaR/.emacs.d.git

    # In emacs, compile all files in .emacs.d directory
    C-u 0 M-x byte-recompile-directory


    
Oh! The features!
-----------------
### . undo tree
### . Window control : [winner-undo]
### . Tabs : [tabbar]
### . auto-complete
### . yasnippet
### . Color theme : [zenburn]
> [zenburn on GitHub](https://github.com/bbatsov/zenburn-emacs)
### . Dictionary : [youdao, sdcv]
### . Version control : [magit]
Already the latest version[1.2.0]. Use `e` in magit mode to use the
*magic* `ediff` XD.

### . Input method : [eim]
### . Markup language : [markdown, rst]
### . Python support
+ highlight-indentation
+ pyflakes
+ jedi

### . Database access
+ postgresql
+ mysql
+ sqlite

### . Global varibles : []
### . Little modes:

    saveplace      --- automatically save place in files
    ffap           --- file file (or url) at point
    uniquify       --- unique buffer names dependent on file name
    recentf        --- setup a menu of recently opened files
    open-next-line --- Behave like vi's o command
    tramp          --- Transparent Remote Access, Multiple Protocol
    ansi-color     --- translate ANSI escape sequences into faces
    

### . My custom functions : [my-defuns.el]
### . My custom keybinds : [my-key-bindings.el]



 FAQ 
-----
...
