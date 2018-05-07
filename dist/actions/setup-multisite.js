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
    console.log(`L=C.UTF-8 bsdtar -C ${distDirectory} -xf ${path} -s'|[^/]*/||'`);
    return createCommand(`L=C.UTF-8 bsdtar -C ${distDirectory} -xf ${path} -s'|[^/]*/||'`);
};
const removeFile = (path) => {
    return createCommand(`rm ${path}`);
};
const composerInstall = (directory) => {
    console.log(directory, 'gemma');
    return createCommand(`cd ${directory} && composer install`);
};
const moveTo = (srcPath, destPath) => {
    return createCommand(`mv ${srcPath} ${destPath}`);
};
const prepareCommands = (validatedOptions) => {
    let downloadRes = toE(tryCatch(download, validatedOptions.path, validatedOptions.zipUrl));
    let unzipRes = toE(tryCatch(unzip, validatedOptions.path, validatedOptions.webDirectory));
    let removeZipRes = toE(tryCatch(removeFile, validatedOptions.path));
    let composerRes = toE(tryCatch(composerInstall, validatedOptions.webDirectory));
    return monet_1.Right({})
        .map(some => downloadRes.cata((err) => err, (command) => (Object.assign({}, some, { download: command }))))
        .map(some => unzipRes.cata(err => err, command => (Object.assign({}, some, { unzip: command }))))
        .map(some => removeZipRes.cata(err => err, command => (Object.assign({}, some, { removeZip: command }))))
        .map(some => composerRes.cata(err => err, command => (Object.assign({}, some, { composerInstall: command }))))
        .cata((err) => err, (commands) => commands);
};
exports.runCommands = (commands, runSSH, exec) => __awaiter(this, void 0, void 0, function* () {
    try {
        let res1 = yield exec(commands.download)(runSSH(commands.download));
        let res2 = yield exec(commands.unzip)(runSSH(commands.unzip));
        let res3 = yield exec(commands.removeZip)(runSSH(commands.removeZip));
        let res4 = yield exec(commands.composerInstall)(runSSH(commands.composerInstall, false));
        console.log(res1, 'async1');
        console.log(res2, 'async2');
        console.log(res3, 'async3');
        console.log(res4, 'async4');
    }
    catch (e) {
        return new Error(e);
    }
});
exports.setupMultisite = (unvalidatedOptions) => __awaiter(this, void 0, void 0, function* () {
    let validatedOptions = validateOptions(unvalidatedOptions);
    console.log(validatedOptions);
    let commands = prepareCommands(validatedOptions);
    let resOfCommands = yield exports.runCommands(commands, validatedOptions.runSSH, validatedOptions.exec);
    console.log(resOfCommands);
    let events = '';
});
//# sourceMappingURL=setup-multisite.js.map