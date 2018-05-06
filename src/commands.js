/**
 * Execute docker command
 * @param container Container name
 * @param command Command to execute
 * @return string Command string
 */
module.exports.docker 
    = (container) => (command) => `docker exec ${container} sh -c "${command}"`;

module.exports.ssh 
    = ({ username, host, port, keyPath }) => (command, sudo = true) =>
        `ssh -o StrictHostKeyChecking=no ${port ? `-p ${port}` : ''} ${keyPath ? `-i ${keyPath}` : ''} ${username}@${host} "${sudo ? 'sudo' : ''} ${command}"`;

module.exports.scpUpload
    = ({ username, host, port, keyPath }) => (localPath, remotePath) =>
        `scp ${port ? `-P ${port}` : ''} ${keyPath ? `-i ${keyPath}` : ''} ${localPath} ${username}@${host}:${remotePath}`;

module.exports.wget 
    = (url, output) => {
        if (url !== undefined) {
            return new Error('Url is not defined');
        }

        if (url === '') {
            return new Error('Url cannot be empty');
        }

        return `wget --no-check-certificate --content-disposition ${output ? `-O ${output}` : ''} ${url}`;
    }

module.exports.extractZipToCurrentDirectory
    = (path) => {
        if (path === undefined || path === '') {
            return new Error('Path must be defined');
        }

        return `bsdtar -xf ${path} -s'|[^/]*/||'`;
    }