#!/usr/bin/env node

let fs = require('fs');
let shell = require('shelljs');

const docker = {
    exec: container => command => `docker exec ${container} sh -c "${command}"`
}

const CONTAINER = 'wordpressbox';
const dockerBox = docker.exec(CONTAINER);


if (!shell.which('git')) {
    shell.echo('Sorry, this script requires git');
    shell.exit(1);
}

if (!shell.which('docker')) {
    shell.echo('Sorry, this script requires docker');
    shell.exit(1);
}


let publicKey = fs.readFileSync('/home/gemma/.ssh/id_rsa.pub');

// Clean up old container

if (shell.exec(`docker container stop ${CONTAINER}`).code !== 0) {
    shell.echo(`Could not stop container: ${CONTAINER}`);
    shell.exit(1);
}

if (shell.exec(`docker container rm ${CONTAINER}`).code !== 0) {
    shell.echo(`Could not remove container: ${CONTAINER}`);
    shell.exit(1);
}

// Create a new docker container

if (shell.exec(`docker run -t -d -p 4000:80 -p 4001:22 --name ${CONTAINER} ubuntu`).code !== 0) {
    shell.echo('Docker run failed')
    shell.exit(1);
}

// Creates a new non-root user

if (shell.exec(dockerBox('adduser --disabled-password ubuntu')).code !== 0) {
    shell.echo('Could not create user');
    shell.exit(1);
}

shell.exec(dockerBox('cat /etc/passwd'));

if (shell.exec(dockerBox('usermod -aG sudo ubuntu')).code !== 0) {
    shell.echo('Could not add user to the sudo group');
    shell.exit(1);
}

// Setup SSH

if (shell.exec(dockerBox('apt-get update')).code !== 0) {
    shell.echo('Could not update server');
    shell.exit(1);
}

if (shell.exec(dockerBox("apt-get install openssh-server -y")).code !== 0) {
    shell.echo('Installing SSH Server failed');
    shell.exit(1);
}

shell.exec(dockerBox("service ssh status"));

shell.exec(dockerBox("cat /etc/ssh/sshd_config"));


shell.exec(dockerBox('mkdir /home/ubuntu/.ssh'));
shell.exec(dockerBox('touch /home/ubuntu/.ssh/authorized_keys'));

shell.exec(dockerBox('chown -R ubuntu:ubuntu /home/ubuntu/.ssh'));
shell.exec(dockerBox('chmod 700 /home/ubuntu/.ssh'));
shell.exec(dockerBox('chmod 600 /home/ubuntu/.ssh/authorized_keys'));

if (shell.exec(dockerBox(`echo '${publicKey}' >> /home/ubuntu/.ssh/authorized_keys`)).code !== 0) {
    shell.echo('Could not copy public key over to server');
    shell.echo(publicKey);
    shell.exit(1);
} else {
    shell.echo(publicKey);
}

shell.echo(dockerBox('cat /home/ubuntu/.ssh/authorized_keys'));

if (shell.exec(dockerBox('service ssh start')).code !== 0) {
    shell.echo('Could not start ssh server');
    shell.exit(1);   
}

// Setup PHP

// Setup public dir

// Setup Nginx

shell.exec('SSH IN USING:');
shell.exec('ssh -i ~/.ssh/id_rsa ubuntu@localhost -p 4001');
shell.echo('Docker container starter. Go to http://localhost:4000');