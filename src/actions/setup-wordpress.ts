import { 
    Identity, 
    Either, 
    ILeftStatic, 
    IRightStatic, 
    Right, 
    Left, 
    IMonad, 
    Bind, 
    Maybe 
} from 'monet';
let fs = require('fs');
import { safeLoad } from 'js-yaml';

const unit = (i: any) : IMonad<any> => Identity<any>(i);
const toE = (val: any) : Either<Error, any>  => {
    return val instanceof Error ? Left(val) : Right(val);
}

const tryCatch = (fn : Function, ...args : any[]) => {
    try {
        return fn(...args);
    } catch (e) {
        return new Error(e);
    }
}

type UnvalidatedOptions = {
    zipUrl: any,
    path: any,
    webDirectory: any,
    runSSH: Function,
    exec: Function
}

type ZipUrl = string;

type Path = string;

type ValidatedOptions = {
    zipUrl: ZipUrl,
    path: Path,
    webDirectory: Path,
    runSSH: Function,
    exec: Function
}

type CreateZipUrl = (value: any) => ZipUrl|Error

type CreatePath = (value: any) => Path|Error

type validateOptions = (unvalidatedOptions: UnvalidatedOptions) => ValidatedOptions|Error

type Command = string;

type Url = ZipUrl;

type CreateCommand = (value: any) => Command|Error;

type Download = (path: Path, url: ZipUrl) => Command|Error;

type Unzip = (file: Path, distDirectory: Path) => Command|Error;

type RemoveFile = (path: Path) => Command|Error;

type ComposerInstall = (path: Path) => Command|Error;

type Commands = {
    download: Command,
    unzip: Command,
    removeZip: Command,
    composerInstall: Command,
    setWPInstall: Command
};

type PrepareCommands = (validatedOptions : ValidatedOptions) => Commands | Error

const createZipUrl : CreateZipUrl = (value) => {
    if (typeof value !== 'string') {
        return new Error('zip must be a string');
    }

    if (!value.endsWith('.zip')) {
        return new Error('zipurl is not a valid zip file')
    }

    return value;
}

const createPath : CreatePath = (value) => {
    if (typeof value !== 'string') {
        return new Error('Path must be a string');
    }

    return value;
}

const validateOptions : validateOptions = (unvalidatedOptions) => {

    return toE(tryCatch(createZipUrl, unvalidatedOptions.zipUrl))
        .flatMap(some => toE(tryCatch(createPath, unvalidatedOptions.path)))
        .flatMap(some => toE(tryCatch(moveTo, unvalidatedOptions.webDirectory)))
        .cata(
            (err : Error) : any => err, 
            (some : any) => ({
                zipUrl: unvalidatedOptions.zipUrl,
                path: unvalidatedOptions.path,
                runSSH: unvalidatedOptions.runSSH,
                exec: unvalidatedOptions.exec,
                webDirectory: unvalidatedOptions.webDirectory
            })
        );
}

const createCommand : CreateCommand = (value: any) => {
    if (typeof value !== 'string') {
        return new Error('Is not a valid command');
    }

    return value;
}

const download : Download = (path, url) => {
    return createCommand(`wget --no-check-certificate --content-disposition ${path ? `-O ${path}` : ''} ${url}`);
}

const unzip : Unzip = (path, distDirectory) => {
    return createCommand(`L=C.UTF-8 bsdtar -C ${distDirectory} -xf ${path} -s'|[^/]*/||'`);
}

const removeFile : RemoveFile = (path) => {
    return createCommand(`rm ${path}`);
}

const composerInstall : ComposerInstall = (directory : Path) => {
    return createCommand(`composer install --directory ${directory}`);
}

const moveTo = (srcPath: Path, destPath: Path) : Command|Error => {
    return createCommand(`mv ${srcPath} ${destPath}`);
}

const getIP = () : Command => {
    return `ip address show eth0 | awk '/inet / {gsub(/\/.*/,"",$2); print $2}'`;
}

const setWPInstall = (distDirectory: Path) : Command => { 
    return `cd ${distDirectory}/public && wp core install --url="http://172.17.0.2"  --title='New WP Site' --admin_user="admin" --admin_password="admin" --admin_email="gblackuk@gmail.com"`;
}

const readFile = (ymlFile: Path) => {
    return fs.readFileSync(ymlFile, 'utf8');
}

const parseYml = (yml: string) => {
    return safeLoad(yml);
}

const prepareCommands : PrepareCommands = (validatedOptions) => {
    let downloadRes = toE(tryCatch(download, validatedOptions.path, validatedOptions.zipUrl));
    let unzipRes = toE(tryCatch(unzip, validatedOptions.path, validatedOptions.webDirectory));
    let removeZipRes = toE(tryCatch(removeFile, validatedOptions.path));
    let composerRes = toE(tryCatch(composerInstall, validatedOptions.webDirectory));
    let setWPInstallRes = toE(tryCatch(setWPInstall, validatedOptions.webDirectory));

    return Right({})
        .map(some => downloadRes.cata((err: any) => err, (command: Command) => ({ ...some, download: command })))
        .map(some => unzipRes.cata(err => err, command => ({ ...some, unzip: command })))
        .map(some => removeZipRes.cata(err => err, command => ({ ...some, removeZip: command })))
        .map(some => composerRes.cata(err => err, command => ({ ...some, composerInstall: command })))
        .map(some => setWPInstallRes.cata(err => err, command => ({ ...some, setWPInstall: command })))
        .cata(
            (err: Error) => err,
            (commands: any) => commands
        );
}

export const runCommands = async (commands : Commands, runSSH: Function, exec: Function) => {
    try {
        await exec(commands.download)(runSSH(commands.download));
        await exec(commands.unzip)(runSSH(commands.unzip));
        await exec(commands.removeZip)(runSSH(commands.removeZip));
        await exec(commands.composerInstall)(runSSH(commands.composerInstall, false));
        await exec(commands.setWPInstall)(runSSH(commands.setWPInstall, false));
        
        return 'Finished running commands';
    } catch (e) {
        return new Error(e);
    }
}

let eToPromise = (fn) => (e) => e.flatMap(option => fn(option));

const run = {
    validate: async (unvalidOptions) => toE(validateOptions(unvalidOptions)),
    prepare: async (validOptions) => toE(prepareCommands(validOptions)),
    execute: (ssh, exec) => async (commands) => runCommands(commands, ssh, exec)
}

export const setupWordpress = async (unvalidatedOptions : UnvalidatedOptions) => {
    let result = await run.validate(unvalidatedOptions)
        .then(eToPromise(run.prepare))
        .then(eToPromise(run.execute(unvalidatedOptions.runSSH, unvalidatedOptions.exec)))

    return result;
}