"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shelljs_1 = require("shelljs");
exports.runSync = (exec, echo, exit) => (command) => {
    let { code } = exec(command.executable);
    echo(command.executable);
    if (code !== 0) {
        echo(`${command.executable} failed!`);
        echo(command.failureMessage);
    }
    if (code !== 0 && command.stopOnError) {
        exit(1);
    }
};
exports.makeCommand = (command, failureMessage, stopOnError = true) => {
    return {
        executable: command,
        failureMessage,
        stopOnError
    };
};
exports.executeCommands = (commands, fn) => {
    commands.forEach(command => fn(command));
};
exports.mapCommands = (commands) => {
    return commands.map((command, index) => {
        return exports.makeCommand(command[0], command[1], command[2]);
    });
};
exports.run = exports.runSync(shelljs_1.exec, shelljs_1.echo, shelljs_1.exit);
exports.runCommands = (commands) => {
    exports.executeCommands(exports.mapCommands(commands), exports.run);
    shelljs_1.exit(1);
};
//# sourceMappingURL=helpers.js.map