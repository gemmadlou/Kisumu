let { exec, echo, exit } = require('shelljs');

module.exports.exec = (message) => (command) => {
    return new Promise((resolve, reject) => {
        let { stderr, stdout } = exec(command, { silent: false, async: true });

        stdout.on('data', (outputFromCommand) => {
            echo(outputFromCommand);
        });

        stdout.on('end', () => {
            echo(message);
            resolve(message);
        });

        stdout.on('error', () => {
            echo('FAILURE');
            echo(`fail: ${command}`)
            //reject(new Error(`Failed! ${message}`));
            exit(1);
        });
    });
}