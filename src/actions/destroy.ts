import { runCommands } from "../helpers/helpers";

export const dockerDestroy = ({ CONTAINER = 'wordpressbox' } : { CONTAINER : string }) => {

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

    runCommands(commands);
}
