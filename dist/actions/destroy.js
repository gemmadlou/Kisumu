"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers/helpers");
exports.dockerDestroy = ({ CONTAINER = 'wordpressbox' }) => {
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
    helpers_1.runCommands(commands);
};
//# sourceMappingURL=destroy.js.map