import { Left, Right, IO, Either } from 'monet';

const allowMultiSite = (file: string) => {
    return `sed -ri 's/^(\s*)(ALLOW_MULTISITE\s*=\s*false\s*$)/\ALLOW_MULTISITE=true/' ${file}`;
}

const convertToMultisite = (publicPath: string, url: string) => {
    return `cd ${publicPath} && wp core multisite-convert --url="${url}/wordpress" --base="/"`;
}

const setEnvAsMultiSite = (file: string) => {
    return `sed -ri 's/^(\s*)(IS_MULTISITE\s*=\s*false\s*$)/\IS_MULTISITE=true/' ${file}`;
}

const removeWebsiteNginxConf = () => {
    return `rm -f /etc/nginx/sites-enabled/website.conf`;
}

const addNetworkNginxConf = () => {
    return 'ln -s /etc/nginx/sites-available/wp.network.conf /etc/nginx/sites-enabled/wp.network.conf';
}

const restartNginx = () => {
    return 'service nginx restart';
}

const run = {
    allowMultiSite: (exec, runSSH, path) => {
       return exec('Replace yaml text')(runSSH(allowMultiSite(path)))
            .then(Right, Left);
    },

    convertToMultisite: (exec, runSSH, publicPath: string, url: string) => () => {
        return exec('Convert to multisite')(runSSH(convertToMultisite(publicPath, url), false))
            .then(Right, Left);
    },

    setEnvAsMultiSite: (exec, runSSH, path) => () => {
        return exec('Set env to multisite')(runSSH(setEnvAsMultiSite(path)))
             .then(Right, Left);
    },

    removeWebsiteNginxConf: (exec, runSSH) => () => {
        return exec('Remove website nginx conf')(runSSH(removeWebsiteNginxConf))
            .then(Right, Left);
    },

    addNetworkNginxConf: (exec, runSSH) => () => {
        return exec('Add network nginx conf')(runSSH(addNetworkNginxConf))
            .then(Right, Left);
    },

    restartNginx: (exec, runSSH) => () => {
        return exec('Restart nginx')(runSSH(restartNginx))
            .then(Right, Left);
    }
}

const runner = (exec, runSSH, runMessage: string, command : string) => {
    return exec(runMessage)(runSSH(command));
}

const eitherToPromise = (either : Either<any, any>) => either.cata(err => Promise.reject(err), val => Promise.resolve(val));


export const setupMultisite = ({ runSSH, exec }) => {
    let ymlFileName = '.env';
    let distDirectory = '/var/www/html';
    let url = 'http://172.17.0.2';

    run.allowMultiSite(exec, runSSH, `${distDirectory}/${ymlFileName}`)
        .then(eitherToPromise)
        .then(run.convertToMultisite(exec, runSSH, distDirectory + '/public', url))
        .then(eitherToPromise)
        .then(run.setEnvAsMultiSite(exec, runSSH,`${distDirectory}/${ymlFileName}`))
        .then(eitherToPromise)
        .then(run.removeWebsiteNginxConf(exec, runSSH))
        .then(eitherToPromise)
        .then(run.addNetworkNginxConf(exec, runSSH))
        .then(eitherToPromise)
        .then(run.restartNginx(exec, runSSH))
        .then(eitherToPromise)
        .then(console.log, console.error)
}