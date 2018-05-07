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
    //mvToWebDirectory: Command,
    unzip: Command,
    removeZip: Command,
    composerInstall: Command
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
    console.log(`L=C.UTF-8 bsdtar -C ${distDirectory} -xf ${path} -s'|[^/]*/||'`)
    return createCommand(`L=C.UTF-8 bsdtar -C ${distDirectory} -xf ${path} -s'|[^/]*/||'`);
}

const removeFile : RemoveFile = (path) => {
    return createCommand(`rm ${path}`);
}

const composerInstall : ComposerInstall = (directory : Path) => {
    console.log(directory, 'gemma')
    return createCommand(`cd ${directory} && composer install`);
}

const moveTo = (srcPath: Path, destPath: Path) : Command|Error => {
    return createCommand(`mv ${srcPath} ${destPath}`);
}

const prepareCommands : PrepareCommands = (validatedOptions) => {
    let downloadRes = toE(tryCatch(download, validatedOptions.path, validatedOptions.zipUrl));
    //let moveToRes = toE(tryCatch(moveTo, validatedOptions.path, validatedOptions.webDirectory));
    let unzipRes = toE(tryCatch(unzip, validatedOptions.path, validatedOptions.webDirectory));
    let removeZipRes = toE(tryCatch(removeFile, validatedOptions.path));
    let composerRes = toE(tryCatch(composerInstall, validatedOptions.webDirectory));

    return Right({})
        .map(some => downloadRes.cata((err: any) => err, (command: any) => ({ ...some, download: command })))
        //.map(some => moveToRes.cata((err: any) => err, (command: any) => ({ ...some, moveTo: command })))
        .map(some => unzipRes.cata(err => err, command => ({ ...some, unzip: command })))
        .map(some => removeZipRes.cata(err => err, command => ({ ...some, removeZip: command })))
        .map(some => composerRes.cata(err => err, command => ({ ...some, composerInstall: command })))
        .cata(
            (err: Error) => err,
            (commands: any) => commands
        );
}

export const runCommands = async (commands : Commands, runSSH: Function, exec: Function) => {
    try {
        let res1 = await exec(commands.download)(runSSH(commands.download));
        //await exec(runSSH(commands.mvToWebDirectory))
        let res2 = await exec(commands.unzip)(runSSH(commands.unzip));
        let res3 = await exec(commands.removeZip)(runSSH(commands.removeZip));
        let res4 = await exec(commands.composerInstall)(runSSH(commands.composerInstall, false));
        console.log(res1, 'async1');
        console.log(res2, 'async2')
        console.log(res3, 'async3');
        console.log(res4, 'async4');
    } catch (e) {
        return new Error(e);
    }
}

export const setupMultisite = async (unvalidatedOptions : UnvalidatedOptions) => {
    let validatedOptions = validateOptions(unvalidatedOptions);
    console.log(validatedOptions)
    /**
     * download
     * unzip
     * remove zip
     * composer install
     */
    let commands = prepareCommands(validatedOptions);

    // toE(commands)
    //     .map(async (commands) => {
    //         for (const key in commands) {
    //             await exec(commands[key]);
    //         }
    //     });
    let resOfCommands = await runCommands(commands, validatedOptions.runSSH, validatedOptions.exec);

    console.log(resOfCommands);

    let events = /** */ ''
}