import { runCommands } from "../helpers/helpers";
import { Just, Nothing, Right, Left } from "monet";

const resolveCata = (val) => val;

const maybeRunSSH = (runSSH: Function, isSSH: boolean) => (command: string) => {
    return isSSH ? Right(runSSH(command)) : Left(command);
}

export const provision = ({ CONTAINER = 'wordpressbox', runSSH, isSSH = true } : { CONTAINER : string, runSSH: Function, isSSH: boolean }) => {

    let run = maybeRunSSH(runSSH, isSSH)
    let prepare = (command) => run(command).cata(resolveCata, resolveCata);

    let commands = [
        [
            prepare(`apt-get update -y`),
            'Could not update server'
        ],
        [
            prepare(`apt-get install -y tzdata`),
            'Could not install tzdata'
        ],
        [
            prepare('LC_ALL=C.UTF-8 add-apt-repository -y ppa:ondrej/php'),
            'Could not install PHP repository'
        ],
        [
            prepare(`apt-get update -y`),
            'Could not update the server again'
        ],
        [
            prepare('apt-get -y upgrade'),
            'Could not upgrade the server'
        ],
        [
            prepare('apt-get install -y php7.1 php7.1-cli php7.1-common php7.1-json php7.1-opcache php7.1-mysql php7.1-mbstring php7.1-mcrypt php7.1-zip php7.1-fpm'),
            'Could not install PHP 7.1'
        ],
        [
            prepare('service php7.1-fpm restart'),
            'Could not restart PHP FPM'
        ],
        [
            prepare(`cp ${__dirname}/src/bash/composer-setup.sh ~/composer-setup.sh`),
            'Could not upload composer.sh file'
        ],
        [
            prepare(`chmod +x ~/composer-setup.sh`),
            'Could not make composer-setup.sh executable'
        ],
        [
            prepare('~/composer-setup.sh'),
            'Could not run composer setup'
        ],
        [
            prepare('mv ~/composer.phar /usr/local/bin/composer'),
            'Could not make composer file global'
        ],
        [
            prepare('composer install'),
            'Could not install composer packages'
        ]
    ];

    runCommands(commands);
}
