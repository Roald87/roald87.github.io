---
layout: page
title: TwinCAT
---

# TwinCAT

## [Links](/tclinks)

Collection of links to various TwinCAT resources.

## [Changelog](/TwinCatChangelog)

A community effort to track changes in TwinCAT software.

## [Post archive](/tcarchive) <a href="https://roald87.github.io/feed/twincat.xml"><i class="icon-rss-squared">

My latest articles on TwinCAT.

{% assign twincat_posts = site.posts | where_exp: "post", "post.category contains 'twincat'" %}
{% assign date_format = site.minima.date_format | default: "%b %-d, %Y" %}
{% for post in twincat_posts limit:5 %}

- [{{ post.title }}]({{ post.url }}) <small class="post-date"><i class="icon-calendar"></i>{{ post.date | date: date_format }}</small>
  {% endfor %}
