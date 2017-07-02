/**
 * Created by mark.mccracken on 01/07/2017.
 */
let path = require('path');
import {currentDateString, currentTimestampString,
    ReusableLog, LoggingConfig, ConsoleAllColor, Colors,
    redirectLoggingToFilesSync,
    createReusableLoggerSync,
    removeEmptyLogFilesSync} from "../";
let currentDate: string = currentDateString();
let generatePathLocation = (suffix: string) => {
    if (suffix === "log") return path.resolve(`${__dirname}/volume/logs/sync-logs/${currentDate}.log`);
    return path.resolve(`${__dirname}/volume/logs/sync-logs/${currentDate}.${suffix}.log`);
};
let logPath = generatePathLocation('log');
let infoPath = generatePathLocation('info');
let errorPath = generatePathLocation('error');
let loggingConfig: LoggingConfig = {
    log:   { printToTerminal: true },
    info:  { location: infoPath,  printToTerminal: true },
    error: { location: errorPath, printToTerminal: true }
};
// overrides the console.log, console.info, and console.error methods. Note: console.time will be considered as to info.
redirectLoggingToFilesSync(loggingConfig);

let reusableLogLocation = path.resolve(`${__dirname}/volume/logs/sync-logs/reusable_logs`);
// generates a function we can use to create the reusable logs.
let reusableLogger = createReusableLoggerSync(reusableLogLocation);

// provide types for colored Logging
declare const console: Console & ConsoleAllColor;

let item1 = {
    error: "Error: table constraint not satisfied",
    values: [1, 2, 3, null, 5],
    query: `INSERT INTO TABLE_THAT_NEEDS_PRIMARY_KEY_CONDITION_SATISFIED
            VALUES (1), (2), (3), (NULL), (5)`,
    additionalDetails: {
        comment: `can have whatever fields I want in here`,
        description: `sql syntax error`,
        lastItem: `the date and dateString items will be added if they're not provided`
    }
};

let item2 = {
    error: "Error: connection timeout",
    values: [1, 2, 3, 4, 5],
    query: `INSERT INTO MY_TABLE
            VALUES (1), (2), (3), (4), (5)`,
    additionalDetails: {
        solution: `only problem was connection timeout, could easily re-run this`
    }
};

reusableLogger(item1);
reusableLogger(item2);

let fs = require("fs");

console.log("Some standard logging information");
console.info("X results successfully inserted, 2 queries errored, 1 retryable. 1 errored with following details: {SQLCODE=24000 or whatever}");
console.error("NAT Type: Strict. No Cod for you.");
console.warnWithColor(Colors.FgRed, "Warning!");

let errorsOccurred;
try {
    errorsOccurred = fs.accessSync(errorPath);
} catch (err) {
    if (err.contains(`ENOENT`)) {
        console.log(`no errors occurred`);
        removeEmptyLogFilesSync(loggingConfig);
        // no errors, no processing to do.
        process.exit(0);
    } else {
        console.error(`Error occurred reading error file.`);
        //can't read the error file, so the above message is probably no use. emergency print.
        process.stderr.write(`Error occurred reading error file.`);
    }
}

console.logWithColor([Colors.FgGreen], "stuff to colorfully log");

let files;
try {
    files = fs.readdirSync(reusableLogLocation);
    if (files.length) {
        files.forEach(logFile => {
            let contents;
            try {
                contents = fs.readFileSync(`${reusableLogLocation}/${logFile}`, "utf8");
                if (contents) {
                    let object: ReusableLog = JSON.parse(contents);
                    console.info(`${currentTimestampString()}`);
                    console.log(`${reusableLogLocation}/${logFile}`);
                    console.log(object);
                    // object now accessible to re process
                    // if (object.error.contains("connection timeout") retry(object.query)
                    // if (object.error.contains("table requires primary key") filterObjectsWithoutPrimaryKeyAndRetry(object.values)
                    // or something like this
                }
            } catch (err) {
                console.error(`Error reading file ${reusableLogLocation}/${logFile}`);
                console.error(err);
                return;
            }
        });
    }
} catch (err) {
    if (err.code === "ENOENT") {} else {
        console.error(`Error reading directory:`);
        console.error(err);
    }
}

removeEmptyLogFilesSync(loggingConfig);