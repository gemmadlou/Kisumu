"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const monet_1 = require("monet");
let fs = require('fs');
const js_yaml_1 = require("js-yaml");
const unit = (i) => monet_1.Identity(i);
const toE = (val) => {
    return val instanceof Error ? monet_1.Left(val) : monet_1.Right(val);
};
const tryCatch = (fn, ...args) => {
    try {
        return fn(...args);
    }
    catch (e) {
        return new Error(e);
    }
};
const createZipUrl = (value) => {
    if (typeof value !== 'string') {
        return new Error('zip must be a string');
    }
    if (!value.endsWith('.zip')) {
        return new Error('zipurl is not a valid zip file');
    }
    return value;
};
const createPath = (value) => {
    if (typeof value !== 'string') {
        return new Error('Path must be a string');
    }
    return value;
};
const validateOptions = (unvalidatedOptions) => {
    return toE(tryCatch(createZipUrl, unvalidatedOptions.zipUrl))
        .flatMap(some => toE(tryCatch(createPath, unvalidatedOptions.path)))
        .flatMap(some => toE(tryCatch(moveTo, unvalidatedOptions.webDirectory)))
        .cata((err) => err, (some) => ({
        zipUrl: unvalidatedOptions.zipUrl,
        path: unvalidatedOptions.path,
        runSSH: unvalidatedOptions.runSSH,
        exec: unvalidatedOptions.exec,
        webDirectory: unvalidatedOptions.webDirectory
    }));
};
const createCommand = (value) => {
    if (typeof value !== 'string') {
        return new Error('Is not a valid command');
    }
    return value;
};
const download = (path, url) => {
    return createCommand(`wget --no-check-certificate --content-disposition ${path ? `-O ${path}` : ''} ${url}`);
};
const unzip = (path, distDirectory) => {
    return createCommand(`L=C.UTF-8 bsdtar -C ${distDirectory} -xf ${path} -s'|[^/]*/||'`);
};
const removeFile = (path) => {
    return createCommand(`rm ${path}`);
};
const composerInstall = (directory) => {
    return createCommand(`composer install --directory ${directory}`);
};
const moveTo = (srcPath, destPath) => {
    return createCommand(`mv ${srcPath} ${destPath}`);
};
const getIP = () => {
    return `ip address show eth0 | awk '/inet / {gsub(/\/.*/,"",$2); print $2}'`;
};
const setWPInstall = (distDirectory) => {
    return `cd ${distDirectory}/public && wp core install --url="http://172.17.0.2"  --title='New WP Site' --admin_user="admin" --admin_password="admin" --admin_email="gblackuk@gmail.com"`;
};
const readFile = (ymlFile) => {
    return fs.readFileSync(ymlFile, 'utf8');
};
const parseYml = (yml) => {
    return js_yaml_1.safeLoad(yml);
};
const prepareCommands = (validatedOptions) => {
    let downloadRes = toE(tryCatch(download, validatedOptions.path, validatedOptions.zipUrl));
    let unzipRes = toE(tryCatch(unzip, validatedOptions.path, validatedOptions.webDirectory));
    let removeZipRes = toE(tryCatch(removeFile, validatedOptions.path));
    let composerRes = toE(tryCatch(composerInstall, validatedOptions.webDirectory));
    let setWPInstallRes = toE(tryCatch(setWPInstall, validatedOptions.webDirectory));
    return monet_1.Right({})
        .map(some => downloadRes.cata((err) => err, (command) => (Object.assign({}, some, { download: command }))))
        .map(some => unzipRes.cata(err => err, command => (Object.assign({}, some, { unzip: command }))))
        .map(some => removeZipRes.cata(err => err, command => (Object.assign({}, some, { removeZip: command }))))
        .map(some => composerRes.cata(err => err, command => (Object.assign({}, some, { composerInstall: command }))))
        .map(some => setWPInstallRes.cata(err => err, command => (Object.assign({}, some, { setWPInstall: command }))))
        .cata((err) => err, (commands) => commands);
};
exports.runCommands = (commands, runSSH, exec) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield exec(commands.download)(runSSH(commands.download));
        yield exec(commands.unzip)(runSSH(commands.unzip));
        yield exec(commands.removeZip)(runSSH(commands.removeZip));
        yield exec(commands.composerInstall)(runSSH(commands.composerInstall, false));
        yield exec(commands.setWPInstall)(runSSH(commands.setWPInstall, false));
        return 'Finished running commands';
    }
    catch (e) {
        return new Error(e);
    }
});
let eToPromise = (fn) => (e) => e.flatMap(option => fn(option));
const run = {
    validate: (unvalidOptions) => __awaiter(this, void 0, void 0, function* () { return toE(validateOptions(unvalidOptions)); }),
    prepare: (validOptions) => __awaiter(this, void 0, void 0, function* () { return toE(prepareCommands(validOptions)); }),
    execute: (ssh, exec) => (commands) => __awaiter(this, void 0, void 0, function* () { return exports.runCommands(commands, ssh, exec); })
};
exports.setupWordpress = (unvalidatedOptions) => __awaiter(this, void 0, void 0, function* () {
    let result = yield run.validate(unvalidatedOptions)
        .then(eToPromise(run.prepare))
        .then(eToPromise(run.execute(unvalidatedOptions.runSSH, unvalidatedOptions.exec)));
    return result;
});
//# sourceMappingURL=setup-wordpress.js.map