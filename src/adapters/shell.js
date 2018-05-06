let { exec, echo } = require('shelljs');

module.exports.exec = (message) => (command) => {
    return new Promise((resolve, reject) => {
        let { stderr, stdout } = exec(command, { silent: true, async: true });

        stdout.on('data', (outputFromCommand) => {
            if (!bus) return;
            bus.emit(eventMessage, outputFromCommand)
        });

        stdout.on('end', () => {
            echo(message);
            resolve(message);
        });

        stdout.on('error', () => {
            reject(new Error(`Failed! ${message}`));
        });
    });
}