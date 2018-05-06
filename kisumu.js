#!/usr/bin/env node

/* global process, __dirname */

/* eslint-disable-next-line no-unused-vars */
let pkginfo = require('pkginfo')(module);
let fs = require('fs');
let { resolve } = require('path');
let shell = require('shelljs');
let program = require('commander');
let {
    docker, 
    ssh, 
    scpUpload, 
    wget,
    extractZipToCurrentDirectory
} = require('./src/commands');
let { checkPrerequisites } = require('./src/prerequisites');
let EventEmitter = require('events');

let { Identity } = require('monet');
let { 
    lift, 
    liftToEither,
    connectPromiseToPromise,
    eitherInToPromise,
    bypassEitherIntoPromise 
} = require('./src/helpers/monads');
let { exec } = require('./src/adapters/shell');

const CONTAINER = 'wordpressbox';
const WEB_PORT = '4000';
const SSH_PORT = '4001';
const USER = 'ubuntu';
const PUBLIC_KEY_PATH = '/home/gemma/.ssh/id_rsa.pub';
const PRIVATE_KEY_PATH = '/home/gemma/.ssh/id_rsa';
const HOST = 'localhost';

const dockerBox = docker(CONTAINER);
const runSSH = ssh({ username: USER, host: 'localhost', port: SSH_PORT, keyPath: PRIVATE_KEY_PATH });
const upload = scpUpload({ username: USER, host: 'localhost', port: SSH_PORT, keyPath: PRIVATE_KEY_PATH });

class bus extends EventEmitter {}

checkPrerequisites(shell);

program
    .version(module.exports.version, '-v, --version');

let publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

program
    .command('provision')
    .action((cmd) => {
        if (shell.exec('ssh-keygen -R [localhost]:4001').code !== 0) {
            shell.echo('Could not remove hosts');   
        }
    
        shell.echo('Updating system');
    
        if (shell.exec(runSSH('apt-get update -y')).code !== 0) {
            shell.echo('Could not run update: ' + runSSH('apt-get update -y'));
            shell.exit(1);   
        }
    
        if (shell.exec(runSSH('apt-get install tzdata -y')).code !== 0) {
            shell.echo('Could not install tzdata needed for Geographical regions configuration');
            shell.exit(1);
        }
    
        shell.echo('Running software properties common');
    
        if (shell.exec(runSSH('apt-get install software-properties-common -y')).code !== 0) {
            shell.echo('Could not add common software repository ' + runSSH('apt-get install software-properties-common -y'));
            shell.exit(1);
        }
    
        shell.echo('Adding PHP repository');
    
        if (shell.exec(runSSH('LC_ALL=C.UTF-8 add-apt-repository -y ppa:ondrej/php')).code !== 0) {
            shell.echo('Could not add PHP repository: ' + runSSH('add-apt-repository ppa:ondrej/php -y'));
            shell.exit(1);
        }


        shell.echo('Updating system again');
    
        if (shell.exec(runSSH('apt-get update -y')).code !== 0) {
            shell.echo('Could not run update: ' + runSSH('apt-get update -y'));
            shell.exit(1);   
        }
    
        shell.echo('Upgrading system');
    
        if (shell.exec(runSSH('apt-get -y upgrade')).code !== 0) {
            shell.echo('Could not run upgrade');
            shell.exit(1);   
        }
    
        shell.echo('Installing PHP');
    
        if (shell.exec(runSSH('apt-get install -y php7.1 php7.1-cli php7.1-common php7.1-json php7.1-opcache php7.1-mysql php7.1-mbstring php7.1-mcrypt php7.1-zip php7.1-fpm')).code !== 0) {
            shell.echo('Could not install PHP 7.1 FPM');
            shell.exit(1);
        }
    
    
        // Setup public dir
    
        shell.echo('Adding public directory');
    
        if (shell.exec(runSSH('mkdir -p /var/www/html/public')).code !== 0) {
            shell.echo('Could not create public directory');
            shell.exit(1);
        }
    
        // Setup Nginx
    
        if (shell.exec(runSSH('apt-get install nginx -y')).code !== 0) {
            shell.echo('Could not install nginx');
            shell.exit(1);   
        }
    
        if (shell.exec(runSSH('chown -R ubuntu: /etc/nginx')).code !== 0) {
            shell.echo('Could not change ownership of nginx directory');
            shell.exit(1);   
        }
    
        if (shell.exec(runSSH('service nginx start')).code !== 0) {
            shell.echo('Start nginx service');
            shell.exit(1);   
        }
    
        if (shell.exec(runSSH('service php7.1-fpm start')).code !== 0) {
            shell.echo('Could not start PHP FPM');
            shell.exit(1);
        }
        
        shell.echo('changing ownership');
    
        if (shell.exec(runSSH('chown -R ubuntu: /var')).code !== 0) {
            shell.echo('Could not change ownership of var directory');
            shell.exit(1);   
        }
    
        if (shell.exec(runSSH('find /var -type d -exec chmod 755 {} \\;')).code !== 0) {
            shell.echo('Could not change ownership of /var directories: ' + runSSH('find /var -type d -exec chmod 755 {} \\;'));
            shell.exit(1);   
        }
    
        if (shell.exec(runSSH('find /var -type f -exec chmod 644 {} \\;')).code !== 0) {
            shell.echo('Could not change ownership of /var files');
            shell.exit(1);   
        }
    
        // Config Nginx

        shell.echo('Configuring nginx')
    
        if (shell.exec(`scp -P 4001 -i ~/.ssh/id_rsa ${__dirname}/templates/public/index.php ubuntu@localhost:/var/www/html/public/index.php`).code !== 0) {
            shell.echo('Could not copy over index.php');
            shell.exit(1);
        }
    
        if (shell.exec(`scp -P 4001 -i ~/.ssh/id_rsa ${__dirname}/templates/nginx.conf ubuntu@localhost:/etc/nginx/sites-available/website.conf`).code !== 0) {
            shell.echo('Could not copy over nginx config');
            shell.exit(1);
        }
    
        if (shell.exec(runSSH('ln -sf /etc/nginx/sites-available/website.conf /etc/nginx/sites-enabled/website.conf')).code !== 0) {
            shell.echo('Could not symlink nginx website.conf');
            shell.exit(1);
        }
    
        if (shell.exec(runSSH('rm /etc/nginx/sites-enabled/default')).code !== 0) {
            shell.echo('Could not symlink nginx website.conf');
            shell.exit(1);
        }
    
        if (shell.exec(runSSH('service nginx restart')).code !== 0) {
            shell.echo('Could not restart nginx');
            shell.exit(1);   
        }
    
        if (shell.exec(runSSH('service php7.1-fpm restart')).code !== 0) {
            shell.echo('Could not restart PHP FPM');
            shell.exit(1);
        }

        if (shell.exec(upload(`${__dirname}/src/bash/composer-setup.sh`, '~/composer-setup.sh')).code !== 0) {
            shell.echo('Could not upload composer setup failed');
            shell.exit(1);
        }

        if (shell.exec(runSSH(`chmod +x ~/composer-setup.sh`)).code !== 0) {
            shell.echo('Could not setup composer failed');
            shell.exit(1);
        }

        if (shell.exec(runSSH(`~/composer-setup.sh`)).code !== 0) {
            shell.echo('Could not setup composer failed');
            shell.exit(1);
        }

        if (shell.exec(runSSH('mv ~/composer.phar /usr/local/bin/composer')).code !== 0) {
            shell.echo('Could not globalise composer.phar failed');
            shell.exit(1);
        }

        if (shell.exec(runSSH('curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -')).code !== 0) {
            shell.echo('getting node setup failed');
            shell.exit(1);
        }

        if (shell.exec(runSSH('apt-get install -y nodejs')).code !== 0) {
            shell.echo('Intalling node 8 failed');
            shell.exit(1);
        }


        shell.exec(runSSH('node -v'));

        shell.echo('Installing GIT');

        if (shell.exec(runSSH('apt-get install -y git')).code !== 0) {
            shell.echo('sudo apt-get install git failed');
            shell.exit(1);
        }

        if (shell.exec(runSSH('apt-get install debconf-utils')).code !== 0) {
            shell.echo('apt-get install debconf-utils failed');
            shell.exit(1);
        }

        shell.echo('Installing mysql');

        if (shell.exec(runSSH(`debconf-set-selections <<< 'mysql-server mysql-server/root_password password root'`)).code !== 0) {
            shell.echo(`debconf-set-selections <<< 'mysql-server mysql-server/root_password password root' failed`);
            shell.exit(1);
        }

        if (shell.exec(runSSH(`debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password root'`)).code !== 0) {
            shell.echo(`debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password your_password' failed`);
            shell.exit(1);
        }

        if (shell.exec(runSSH(`apt-get -y install mysql-server`)).code !== 0) {
            shell.echo(`apt-get -y install mysql-server`);
            shell.exit(1);
        }

        if (shell.exec(runSSH('service mysql start')).code !== 0) {
            shell.echo('sudo service mysql start failed');
            shell.exit(1);
        }
     
        shell.echo(`Docker container starter. Go to http://localhost:${WEB_PORT}`);
    });

program
    .command('setup:dockerbox', 'Set up and launches a docker box')
    .action((cmd) => {
        if (shell.exec(`docker container stop ${CONTAINER}`).code !== 0) {
            shell.echo(`Could not stop container: ${CONTAINER}`);
        }
    
        if (shell.exec(`docker container rm ${CONTAINER}`).code !== 0) {
            shell.echo(`Could not remove container: ${CONTAINER}`);
        }
    
        // Create a new docker container
    
        if (shell.exec(`docker run -t -d -p 4000:80 -p 4001:22 --name ${CONTAINER} -v \`pwd\`:/var/www/html ubuntu:16.04`).code !== 0) {
            shell.echo('Docker run failed');
            shell.exit(1);
        }
    
        if (shell.exec(dockerBox('apt-get update -y')).code !== 0) {
            shell.echo('Sudo package could not be installed');
            shell.exit(1);
        }
    
        // Add sudo
        if (shell.exec(dockerBox('apt-get install sudo -y')).code !== 0) {
            shell.echo('Sudo package could not be installed');
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
    
        if (shell.exec(dockerBox('passwd -d ubuntu')).code !== 0) {
            shell.echo('Could not remove password for ubuntu');
            shell.exit(1);
        }
    
        if (shell.exec(dockerBox('echo \'ubuntu ALL=(ALL) NOPASSWD:ALL\' | sudo EDITOR=\'tee -a\' visudo')).code !== 0) {
            shell.exec('Could not remove sudo password for ubuntu');
            shell.exit(1);
        }
    
        // Setup SSH
    
        if (shell.exec(dockerBox('apt-get update')).code !== 0) {
            shell.echo('Could not update server');
            shell.exit(1);
        }
    
        if (shell.exec(dockerBox('apt-get install openssh-server -y')).code !== 0) {
            shell.echo('Installing SSH Server failed');
            shell.exit(1);
        }
    
        shell.exec(dockerBox('service ssh status'));
    
        shell.exec(dockerBox('cat /etc/ssh/sshd_config'));
    
    
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
    });

program
    .command('docker:ssh')
    .action((cmd) => {
        sh.exec('ls -l');
        shell.exec('ssh-keygen -R [localhost]:4001');
        
        shell.echo('ssh -i ~/.ssh/id_rsa ubuntu@localhost -p 4001');
    });

program
    .command('setup:multisite')
    .action(async (cmd) => {

        /**
         * ## Validate
         * Validate zip url
         * Validate path
         * 
         * ## Prepare commands
         * Get zip
         * Unzip 
         * Remove zip
         * Composer install
         * 
         * ## Execute each
         */
        
        let res = Promise.resolve(lift(wget, 'https://github.com/WordPress-Composer/WordPress-Network-Starter/archive/0.0.1.zip', 'wp.zip'))
            .then(eitherInToPromise(exec('Download WordPress zip')))

            .then(bypassEitherIntoPromise(lift(extractZipToCurrentDirectory, 'wp.zip')))
            .then(eitherInToPromise(exec('Unzip file')))

            //.then(Promise.resolve(lift(extractZipToCurrentDirectory, 'wp.zip')))
            //.then(connectOutputToPromise(exec('Extracting WordPress zip')))
            //.then(console.log)
            .then(result => result.cata(console.error, console.log))
    });

program
    .parse(process.argv);
