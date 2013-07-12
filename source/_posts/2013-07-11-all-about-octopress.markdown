---
layout: post
title: "All about Octopress"
date: 2013-07-11 13:59
comments: true
categories: Programming
---


Installation
------------

### 1. Setup Octopress

    git clone git://github.com/imathis/octopress.git octopress
    cd octopress    # If you use RVM, You'll be asked if you trust the
    .rvmrc file (say yes).
    ruby --version  # Should report Ruby 1.9.3p194


### 2. Install Dependencies

    gem install bundler
    rbenv rehash
    bundle install


### 3. Install the default Octopress theme

    rake intall

  
### 4. Deploying to Github Pages

    rake seup_github_pages
    rake gen_deploy


### 5. Commit the source for blog

    git add .
    git commit -m "COMMIT MESSAGE"
    git push origin source


    
Multiple machines
-----------------
> [Clone Your Octopress to Blog From Two Places](http://blog.zerosharp.com/clone-your-octopress-to-blog-from-two-places/)

    git clone -b source git@github.com:TheWaWaR/thewawar.github.io.git
    
    cd thewawar.github.io
    git clone git@github.com:TheWaWaR/thewawar.github.io.git _deploy

    gem install bundler
    rbenv rehash
    bundle install
    rake setup_github_pages
    # Input:: git@github.com:TheWaWaR/thewawar.github.io.git
    
