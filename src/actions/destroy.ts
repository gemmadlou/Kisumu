import { exec, echo, exit } from 'shelljs';

type runSyncExec = (command: runnerConfig) => void;
type runSyncFun = (exec: Function, echo: Function, exit: Function) => runSyncExec;

let runSync = (exec: Function, echo: Function, exit: Function) => (command: runnerConfig) => {
    let { code } = exec(command.executable);

    echo(`${command.executable} failed!`);
    echo(command.failureMessage);

    if (code !== 0 && command.stopOnError) {
        exit(1);
    }
}

type runnerConfig = {
    executable: string,
    failureMessage: string,
    stopOnError: boolean
}

const makeCommand = (command: string, failureMessage: string, stopOnError: boolean = true) : runnerConfig => {
    return {
        executable: command,
        failureMessage,
        stopOnError
    }
}

const executeCommands = (commands: Array<runnerConfig>, fn: runSyncExec) => {
    commands.forEach(command => fn(command));
}

export const dockerDestroy = ({ CONTAINER = 'wordpressbox' } : { CONTAINER : string }) => {

    let run = runSync(exec, echo, exit);

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

    executeCommands(commands.map((command: Array<any>, index) => {
        return makeCommand(command[0], command[1], command[2] === true);
    }), run)
}
