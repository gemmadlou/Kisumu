import { exec, echo, exit } from 'shelljs';

export type runSyncExec = (command: runnerConfig) => void;

export type runSyncFun = (exec: Function, echo: Function, exit: Function) => runSyncExec;

export type runnerConfig = {
    executable: string,
    failureMessage: string,
    stopOnError: boolean
}

export const runSync = (exec: Function, echo: Function, exit: Function) => (command: runnerConfig) => {
    let { code } = exec(command.executable);

    echo(command.executable);

    if (code !== 0) {
        echo(`${command.executable} failed!`);
        echo(command.failureMessage);
    }

    if (code !== 0 && command.stopOnError) {
        exit(1);
    }
}

export const makeCommand = (command: string, failureMessage: string, stopOnError: boolean = true) : runnerConfig => {
    return {
        executable: command,
        failureMessage,
        stopOnError
    }
}

export const executeCommands = (commands: Array<runnerConfig>, fn: runSyncExec) => {
    commands.forEach(command => fn(command));
}

export const mapCommands = (commands : Array<Array<string|boolean>>) : Array<runnerConfig>=> {
    return commands.map((command: Array<any>, index) => {
        return makeCommand(command[0], command[1], command[2]);
    });
}

export const run = runSync(exec, echo, exit);

export const runCommands = (commands: Array<Array<string|boolean>>) : void => {
    executeCommands(mapCommands(commands), run);
    exit(1);
}