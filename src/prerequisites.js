/**
 * Check prerequisites
 * @param shell nodejs shelljs
 * @todo check shell is shell
 */
module.exports.checkPrerequisites = (shell) => {
    
    if (!shell.which('git')) {
        shell.echo('Sorry, this script requires git');
        shell.exit(1);
    }
    
    if (!shell.which('docker')) {
        shell.echo('Sorry, this script requires docker');
        shell.exit(1);
    }
};