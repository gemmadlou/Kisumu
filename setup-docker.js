#!/usr/bin/env node

let fs = require('fs');
let shell = require('shelljs');
let path = require('path');
let program = require('commander');
let escape = require('escape-quotes');

program
  .version('0.1.0')
  .option('-d, --docker', 'Create docker server')
  .option('-s, --server', 'Setup server')
  .parse(process.argv);


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

if (program.docker) {
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

    shell.echo('SSH IN USING:');
    shell.echo('ssh -i ~/.ssh/id_rsa ubuntu@localhost -p 4001');
    shell.echo('Docker container starter. Go to http://localhost:4000');
}

// Setup PHP

if (program.server) {
    if (shell.exec(dockerBox('apt-get install software-properties-common -y')).code !== 0) {
        shell.echo('Could not add common software repository')
        shell.exit(1);
    }

    if (shell.exec(dockerBox('add-apt-repository ppa:ondrej/php')).code !== 0) {
        shell.echo('Could not add PHP repository');
        shell.exit(1);
    }

    if (shell.exec(dockerBox('apt-get update && apt-get -y upgrade')).code !== 0) {
        shell.exit(1);   
    }

    if (shell.exec(dockerBox('apt-get install php7.1 php7.1-cli php7.1-common php7.1-json php7.1-opcache php7.1-mysql php7.1-mbstring php7.1-mcrypt php7.1-zip php7.1-fpm -y')).code !== 0) {
        shell.echo('Could not install PHP 7.1 FPM');
        shell.exit(1);
    }


    // Setup public dir

    if (shell.exec(dockerBox('mkdir -p /var/www/html/public')).code !== 0) {
        shell.echo('Could not create public directory');
        shell.exit(1);
    }

    // Setup Nginx

    if (shell.exec(dockerBox('apt-get install nginx -y')).code !== 0) {
        shell.echo('Could not install nginx');
        shell.exit(1);   
    }

    if (shell.exec(dockerBox('service nginx start')).code !== 0) {
        shell.echo('Start nginx service');
        shell.exit(1);   
    }

    if (shell.exec(dockerBox('service php7.1-fpm start')).code !== 0) {
        shell.echo('Could not start PHP FPM');
        shell.exit(1);
    }

    // Config Nginx

    let nginxConf = fs.readFileSync(path.resolve(__dirname) + '/templates/nginx.conf', {
        encoding: 'utf8'
    });
    console.log(nginxConf)
    let phpFile = fs.readFileSync(path.resolve(__dirname) + '/templates/public/index.php', {
        encoding: 'utf8'
    });

    if (shell.exec(dockerBox('touch /var/www/html/public/index.php')).code !== 0) {
        shell.echo('Could not create index.php');
        shell.exit(1);
    }

    if (shell.exec(dockerBox(`echo '${escape(phpFile)}' > /var/www/html/public/index.php`)).code !== 0) {
        shell.echo('Could not create index.php');
        shell.exit(1);
    }

    if (shell.exec('scp -P 4001 -i ~/.ssh/id_rsa ./templates/nginx.conf ubuntu@localhost:/etc/nginx/sites-available/website.conf').code !== 0) {
        shell.echo('Could not copy over nginx config');
        shell.exit(1);
    }

    if (shell.exec('ssh -p 4001 -i ~/.ssh/id_rsa ubuntu@localhost "ln -sf /etc/nginx/sites-available/website.conf /etc/nginx/sites-enabled/website.conf"').code !== 0) {
        shell.echo('Could not symlink nginx website.conf');
        shell.exit(1);
    }

    if (shell.exec('ssh -p 4001 -i ~/.ssh/id_rsa ubuntu@localhost "service nginx restart"').code !== 0) {
        shell.echo('Could not restart nginx');
        shell.exit(1);   
    }

    if (shell.exec('ssh -p 4001 -i ~/.ssh/id_rsa ubuntu@localhost "service php7.1-fpm restart"').code !== 0) {
        shell.echo('Could not restart PHP FPM');
        shell.exit(1);
    }
    
}