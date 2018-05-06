System.register("setup-multisite", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var createZipUrl, createPath, validateOptions, createCommand, download, setupMultisite;
    return {
        setters: [],
        execute: function () {
            createZipUrl = (value) => {
                if (typeof value !== 'string') {
                    return new Error('zip must be a string');
                }
                if (!value.endsWith('.zip')) {
                    return new Error('zipurl is not a valid zip file');
                }
                return value;
            };
            createPath = (value) => {
                if (typeof value !== 'string') {
                    return new Error('Path must be a string');
                }
                return value;
            };
            validateOptions = (unvalidatedOptions) => {
                let zipUrl = createZipUrl(unvalidatedOptions.zipUrl);
                let path = createPath(unvalidatedOptions.path);
                return {
                    zipUrl,
                    path
                };
            };
            createCommand = (value) => {
                if (typeof value !== 'string') {
                    return new Error('Is not a valid command');
                }
                return value;
            };
            download = (path, url) => {
                return createCommand(`wget --no-check-certificate --content-disposition ${path ? `-O ${path}` : ''} ${url}`);
            };
            exports_1("setupMultisite", setupMultisite = (unvalidatedOptions) => {
                let validatedOptions = validateOptions(unvalidatedOptions);
                let prepareCommands = '';
                let runCommands = '';
                let events = '';
            });
        }
    };
});
//# sourceMappingURL=kisumu.js.map