# Docker Setup & PHP Nginx Server Provisioning

In development:

<br/>

<img src="docs/kisumu-wordpress-docker-cli-utility.jpg"  width="100%" align="center">

<div style="text-align: right">

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/ac8b484e13b24c9286eb92dd358f9455)](https://www.codacy.com/app/gemmadlou/Node-Nginx-PHP-Shell-Script?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gemmadlou/Node-Nginx-PHP-Shell-Script&amp;utm_campaign=Badge_Grade)
<a href="https://codeclimate.com/github/gemmadlou/Kisumu/maintainability"><img src="https://api.codeclimate.com/v1/badges/a09db4ae351c36dbed71/maintainability" /></a>
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

</div>

### Why make kisumu?

I want to be able to build docker boxes for testing WordPress websites and the multisite network as if I was running a continuous integration tool. I also wanted to provision these boxes in a non-Dockerfile way, so that the same commands can be used on remote boxes on staging, and possibly in production.

## Roadmap

<img src="docs/kisumu-road-map.jpg" width="100%" align="center">

Or rather the goal is to create a tool that makes the operational side of developing, testing and deploying WordPress applications as simple as a one-line command.

### Commands

- [ ] Build a docker box
  ```
  kisumu docker
  ```
- [ ] Provision a box ready for WordPress/SSHing etc 
  ```
  kisumu provision --ip 198.11.33.22
  ```
- [ ] Setup WordPress
  ```
  kisumu wordpress
  ```
- [ ] Setup multisite
  ```
  kisumu setup multisite
  ```


## Resources

#### Publishing multiple ports  
https://stackoverflow.com/questions/28134239/how-to-ssh-into-docker

#### Setting Up PHP
https://www.rosehosting.com/blog/install-php-7-1-with-nginx-on-an-ubuntu-16-04-vps/
