/**
 * Execute docker command
 * @param container Container name
 * @param command Command to execute
 * @return string Command string
 */
module.exports.docker 
    = container => command => `docker exec ${container} sh -c "${command}"`

module.exports.ssh 
    = ({ username, host, port, keyPath }) => command =>
        `ssh ${port ? `-p ${port}` : ''} ${keyPath ? `-i ${keyPath}` : ''} ${username}@${host} "sudo ${command}"`

module.exports.scpUpload
    = ({ username, host, port, keyPath }) => (localPath, remotePath) =>
        'scp -P 4001 -i ~/.ssh/id_rsa ./templates/nginx.conf ubuntu@localhost:/etc/nginx/sites-available/website.conf'