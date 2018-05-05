let { exec } = require('shelljs');

/**
 * 
 * @param string eventMessage 
 * @param EventEmitter bus
 * @param string command
 * @return Promise
 */
module.exports.exec = (eventMessage, bus) => (command) => {
    return new Promise((resolve, reject) => {
        let { stderr, stdout } = exec(command, { silent: true, async: true});

        stdout.on('data', (outputFromCommand) => {
            bus.emit(eventMessage, outputFromCommand)
        });

        stdout.on('end', (outputFromCommand) => {
            resolve(outputFromCommand);
        });

        stderr.on(err => {
            reject(new Error(err));
        });
    });
}