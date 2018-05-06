/**
 * ## Validate
 * Validate zip url
 * Validate path
 * 
 * ## Prepare commands
 * Get zip
 * Unzip 
 * Remove zip
 * Composer install
 * 
 * ## Execute each
 */

type UnvalidatedOptions = {
    zipUrl: any,
    path: any
}

type ZipUrl = string;

type Path = string;

type ValidatedOptions = {
    zipUrl: ZipUrl|Error,
    path: Path|Error
}

type CreateZipUrl = (value: any) => ZipUrl|Error

type CreatePath = (value: any) => Path|Error

type validateOptions = (unvalidatedOptions: UnvalidatedOptions) => ValidatedOptions

type Command = string;

type Url = ZipUrl;

type CreateCommand = (value: any) => Command|Error;

type Download = (path: Path, url: ZipUrl) => Command|Error;

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
    let zipUrl = createZipUrl(unvalidatedOptions.zipUrl);

    let path = createPath(unvalidatedOptions.path);

    return {
        zipUrl,
        path
    }
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

export const setupMultisite = (unvalidatedOptions : UnvalidatedOptions) => {
    let validatedOptions = validateOptions(unvalidatedOptions);

    /**
     * download
     * unzip
     * remove zip
     * composer install
     */
    let prepareCommands = /***  */ ''

    let runCommands = /**  */ ''

    let events = /** */ ''
}
