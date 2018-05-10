import { Left, Right, IO, Either } from 'monet';

const readFile = () => {
    
}

export const setupMultisite = () => {
    let ymlFileName = '.env';
    let distDirectory = '/var/www/html/public';

    // read yml file and find ALLOW_MULTISITE=false
    // write to yml file and set ALLOW_MULTISITE=true
    // convert to multisite wp core multisite-convert
}