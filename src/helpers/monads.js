const { Right, Left, Identity } = require('monet');

module.exports.liftToEither = liftToEither = (data) => {
    if (data instanceof Error) {
        return Left(data)
    } else {
        return Right(data);
    }
}

/**
 * TryCatch to prevent runtime errors or unhandled errors from breaking the script
 * @return Error|any
 */
module.exports.tryCatch = tryCatch = (fn, ...args) => {
    try {
        return Identity(fn(...args));
    } catch (e) {
        return Left(new Error(e));
    }
}

module.exports.eitherInToPromise = (fn) => (either) => either.cata(
    Left, 
    command => fn(command).then(liftToEither).catch(Left)
)

module.exports.bypassEitherIntoPromise = (commandEither) => (promiseOutPutEither) => {
    try {
        if (promiseOutPutEither.isLeft()) {
            return promiseOutPutEither.left();
        }
    
        return commandEither;

    } catch (e) {
        return Left(new Error(e));
    }
}

/**
 * Executes a command along with arguments returns a mappable either monad
 * @param callable fn 
 * @param any args 
 */
module.exports.lift = lift = (fn, ...args) => tryCatch(fn, ...args).flatMap(liftToEither);


/**
 * Connects a plain Promise result to another function
 * @param function fn
 * @param result Promise resolved output 
 */
module.exports.connectPromiseToPromise = (fn) => (result) => result.flatMap(input => lift(fn(input)))