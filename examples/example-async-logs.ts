/**
 * Created by mark.mccracken on 01/07/2017.
 */
let path = require('path');
import {currentDateString, currentTimestampString,
    ReusableLog, LoggingConfig, Colors, ConsoleAllColor,
    redirectLoggingToFiles,
    ReusableLogger,
    removeEmptyLogFiles} from "flogger-ts";
let currentDate: string = currentDateString();
let generatePathLocation = (suffix: string) => {
    if (suffix === "log") return path.resolve(`${__dirname}/volume/logs/async-logs/${currentDate}.log`);
    return path.resolve(`${__dirname}/volume/logs/async-logs/${currentDate}.${suffix}.log`);
};
let logPath = generatePathLocation('log');
let infoPath = generatePathLocation('info');
let errorPath = generatePathLocation('error');
let loggingConfig: LoggingConfig = {
    log:   { location: logPath,   printToTerminal: true },
    info:  { location: infoPath,  printToTerminal: true },
    error: { location: errorPath, printToTerminal: true }
};
redirectLoggingToFiles(loggingConfig);

// provide types for colored Logging
declare const console: Console & ConsoleAllColor; //even works for warn

let reusableLogLocation = path.resolve(`${__dirname}/volume/logs/async-logs/reusable_logs`);
let reusableLogger = new ReusableLogger(reusableLogLocation);

reusableLogger.log({
    error: "Error: table constraint not satisfied",
    values: [1, 2, 3, null, 5],
    query: `INSERT INTO TABLE_THAT_NEEDS_PRIMARY_KEY_CONDITION_SATISFIED
            VALUES (1), (2), (3), (NULL), (5)`,
    additionalDetails: {
        comment: `can have whatever fields I want in here`,
        description: `sql syntax error`,
        lastItem: `the date and dateString items will be added if they're not provided`
    }
}).then(); //only here to stop warning that promise returned from function log is ignored;

reusableLogger.log({
    error: "Error: connection timeout",
    values: [1, 2, 3, 4, 5],
    query: `INSERT INTO MY_TABLE
            VALUES (1), (2), (3), (4), (5)`,
    additionalDetails: {
        solution: `only problem was connection timeout, could easily re-run this`
    }
}).then();

console.log("Some standard logging information");
console.logWithColor([Colors.FgMagenta], "magenta stuff");
console.info("X results successfully inserted, 1 query errored with following details: {SQLCODE=24000 or whatever}");
console.error("this is bad.");
console.warnWithColor([Colors.FgWhite], "Warning. Shoddy code follows");

let fs = require("fs");
fs.readdir(reusableLogLocation, (err, files) => {
   if (err) {
       if (err.code === "ENOENT") {
           console.log(`no entry for ${reusableLogLocation}`);
           return;
       } else {
           console.error(`Error reading directory:`);
           console.error(err);
           return;
       }
   }
    if (files.length) {
        files.forEach(logFile => {
            let contents;
                fs.readFile(`${reusableLogLocation}/${logFile}`, "utf8", (err, contents) => {

                    if (err) {
                        console.error(`Error reading file ${reusableLogLocation}/${logFile}`);
                        console.error(err);
                        return;
                    }
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
                    return;
                });
        });
    }
});


removeEmptyLogFiles(loggingConfig);