"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shelljs_1 = require("shelljs");
let runSync = (exec, echo, exit) => (command) => {
    let { code } = exec(command.executable);
    echo(`${command.executable} failed!`);
    echo(command.failureMessage);
    if (code !== 0 && command.stopOnError) {
        exit(1);
    }
};
const makeCommand = (command, failureMessage, stopOnError = true) => {
    return {
        executable: command,
        failureMessage,
        stopOnError
    };
};
const executeCommands = (commands, fn) => {
    commands.forEach(command => fn(command));
};
exports.dockerDestroy = ({ CONTAINER = 'wordpressbox' }) => {
    let run = runSync(shelljs_1.exec, shelljs_1.echo, shelljs_1.exit);
    let commands = [
        [
            `docker network disconnect wpnetwork ${CONTAINER}`,
            `Could not disconnect wpnetwork from container ${CONTAINER}`,
            false
        ],
        [
            `docker network rm wpnetwork`,
            `Could not remove wpnetwork on docker networks`,
            false
        ],
        [
            `docker container stop ${CONTAINER}`,
            `Could not stop container: ${CONTAINER}`,
            false
        ],
        [
            `docker container rm ${CONTAINER}`,
            `Could not remove container: ${CONTAINER}`,
            false
        ]
    ];
    executeCommands(commands.map((command, index) => {
        return makeCommand(command[0], command[1], command[2] === true);
    }), run);
};
//# sourceMappingURL=destroy.js.map