"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monet_1 = require("monet");
const allowMultiSite = (file) => {
    return `sed -ri 's/^(\s*)(ALLOW_MULTISITE\s*=\s*false\s*$)/\ALLOW_MULTISITE=true/' ${file}`;
};
const convertToMultisite = (publicPath, url) => {
    return `cd ${publicPath} && wp core multisite-convert --url="${url}/wordpress" --base="/"`;
};
const setEnvAsMultiSite = (file) => {
    return `sed -ri 's/^(\s*)(IS_MULTISITE\s*=\s*false\s*$)/\IS_MULTISITE=true/' ${file}`;
};
const removeWebsiteNginxConf = () => {
    return `rm -f /etc/nginx/sites-enabled/website.conf`;
};
const addNetworkNginxConf = () => {
    return 'ln -s /etc/nginx/sites-available/wp.network.conf /etc/nginx/sites-enabled/wp.network.conf';
};
const restartNginx = () => {
    return 'service nginx restart';
};
const run = {
    allowMultiSite: (exec, runSSH, path) => {
        return exec('Replace yaml text')(runSSH(allowMultiSite(path)))
            .then(monet_1.Right, monet_1.Left);
    },
    convertToMultisite: (exec, runSSH, publicPath, url) => () => {
        return exec('Convert to multisite')(runSSH(convertToMultisite(publicPath, url), false))
            .then(monet_1.Right, monet_1.Left);
    },
    setEnvAsMultiSite: (exec, runSSH, path) => () => {
        return exec('Set env to multisite')(runSSH(setEnvAsMultiSite(path)))
            .then(monet_1.Right, monet_1.Left);
    },
    removeWebsiteNginxConf: (exec, runSSH) => () => {
        return exec('Remove website nginx conf')(runSSH(removeWebsiteNginxConf))
            .then(monet_1.Right, monet_1.Left);
    },
    addNetworkNginxConf: (exec, runSSH) => () => {
        return exec('Add network nginx conf')(runSSH(addNetworkNginxConf))
            .then(monet_1.Right, monet_1.Left);
    },
    restartNginx: (exec, runSSH) => () => {
        return exec('Restart nginx')(runSSH(restartNginx))
            .then(monet_1.Right, monet_1.Left);
    }
};
const runner = (exec, runSSH, runMessage, command) => {
    return exec(runMessage)(runSSH(command));
};
const eitherToPromise = (either) => either.cata(err => Promise.reject(err), val => Promise.resolve(val));
exports.setupMultisite = ({ runSSH, exec }) => {
    let ymlFileName = '.env';
    let distDirectory = '/var/www/html';
    let url = 'http://172.17.0.2';
    run.allowMultiSite(exec, runSSH, `${distDirectory}/${ymlFileName}`)
        .then(eitherToPromise)
        .then(run.convertToMultisite(exec, runSSH, distDirectory + '/public', url))
        .then(eitherToPromise)
        .then(run.setEnvAsMultiSite(exec, runSSH, `${distDirectory}/${ymlFileName}`))
        .then(eitherToPromise)
        .then(run.removeWebsiteNginxConf(exec, runSSH))
        .then(eitherToPromise)
        .then(run.addNetworkNginxConf(exec, runSSH))
        .then(eitherToPromise)
        .then(run.restartNginx(exec, runSSH))
        .then(eitherToPromise)
        .then(console.log, console.error);
};
//# sourceMappingURL=setup-multisite.js.map