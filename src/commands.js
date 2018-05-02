/**
 * Execute docker command
 * @param container Container name
 * @param command Command to execute
 * @return string Command string
 */
module.exports.docker 
    = (container) => (command) => `docker exec ${container} sh -c "${command}"`;

module.exports.ssh 
    = ({ username, host, port, keyPath }) => (command) =>
        `ssh -o StrictHostKeyChecking=no ${port ? `-p ${port}` : ''} ${keyPath ? `-i ${keyPath}` : ''} ${username}@${host} "sudo ${command}"`;

module.exports.scpUpload
    = ({ username, host, port, keyPath }) => (localPath, remotePath) =>
        `scp ${port ? `-P ${port}` : ''} ${keyPath ? `-i ${keyPath}` : ''} ${localPath} ${username}@${host}:${remotePath}`;