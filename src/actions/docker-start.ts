import { runCommands } from "../helpers/helpers";
import { exec, exit } from 'shelljs';
let parse = require('node-shell-parser');

type DockerBox = (value: string) => string;

const getImage = () => {
    let { code, stdout } = exec('docker image ls');
    let box = parse(stdout).filter(output => {
        return output.REPOSITORY === 'wordpressbox/starter';
    });
    
    return box.length === 1 ? box[0] : null;
}

const getContainer = () => {
    let containers = exec('docker container ls --all');

    let container = parse(containers.stdout).filter(output => {
        return output.NAMES === 'wordpressbox';
    }).map(output => {
        output.commitId = output.CONTAINER + output.ID;
        return output;
    });
    
    return container.length === 1 ? container[0] : null;
}

export const dockerStart = ({ CONTAINER = 'wordpressbox', dockerBox } : { CONTAINER : string, dockerBox: DockerBox }) => {
    
    let image = getImage();
    let container = getContainer();
    let commands = [];

    if (image && container.length !== 0) {
        commands = commands.concat([
            [
                `docker commit ${container.commitId} wordpressbox/starter`,
                `Could not create personal docker starter`
            ]
        ])
    }

    commands = commands.concat([
        [
            `docker run -t -d -p 4000:80 -p 4001:22 --name ${CONTAINER} -v \`pwd\`:/var/www/html wordpressbox/starter`, 
            `Could not start docker container: ${CONTAINER}`
        ],
        [
            dockerBox('service nginx start'),
            `Could not start nginx`
        ],
        [
            dockerBox('service ssh start'),
            `Could not start ssh service`
        ],
        [
            dockerBox('service php7.1-fpm start'),
            `Could not start PHP FPM Service`
        ],
        [
            dockerBox('service mysql start'),
            `Could not start mysql service`
        ]
    ]);

    runCommands(commands);
}
