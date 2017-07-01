#flogger-ts
A file logger that's easy to configure, transparent to use, and generates recoverable logs that can be re-processed.



###Why
I've been working with databases and have been streaming and moving files a lot lately, some of which are in batches which occasionally might fail for a variety of reasons, and I need some logs to see what's gone on.
This has probably been solved before, however I wanted a solution I fully understood and have control over to change as I see fit.
- I wanted a logger that I could use in docker, to both print to the console when developing, and log to a file when something runs remotely.
- I wanted to easily know if an error had occurred in some process, that needed attention.
- I wanted to be able to easily recover from error failures, and be able to write a script the would process any failed items.
- I wanted to be able to log both synchronously and asynchronously.
- I wanted folders to be generated automatically for me if they don't exist already.
- I don't want to have to do much different in my regular code. I'm very used to console.log
- I want to be able to print things to the terminal in color easily. Sometimes I have a lot of logs for debugging and am feeling ashamed of myself for needing so much logging. Colors ease the shame.

###How
- do the deed:
```shell
npm install flogger-ts
```
- import into your typescript file: `import { ... } from "flogger-ts";`
- choose your imports: sync or async. Note, if using async, events might even be printed to the terminal in an order different to being sent
- set up your log file locations.
- get to work.

This looks like the following:
```typescript
const path = require("path");
import {currentDateString, currentTimestampString,
        ReusableLog, LoggingConfig,
        Colors,
        redirectLoggingToFilesSync,
        createReusableLoggerSync,
        removeEmptyLogFilesSync} from "flogger-ts";
const currentDate: string = currentDateString();
const generatePathLocation = (suffix: string) => {
    if (suffix === "log") return path.resolve(`${__dirname}/volume/logs/sync-logs/${currentDate}.log`);
    return path.resolve(`${__dirname}/volume/logs/sync-logs/${currentDate}.${suffix}.log`);
};
const logPath = generatePathLocation('log');
const infoPath = generatePathLocation('info');
const errorPath = generatePathLocation('error');
const loggingConfig: LoggingConfig = {
    log:   { location: logPath,   printToTerminal: true },
    info:  { location: infoPath,  printToTerminal: true },
    error: { location: errorPath, printToTerminal: true }
};
// overrides the console.log, console.info, and console.error methods. Note: console.time will be considered as to info.
redirectLoggingToFilesSync(loggingConfig);

const reusableLogLocation = path.resolve(`${__dirname}/volume/logs/sync-logs/reusable_logs`);
// generates a function we can use to create the reusable logs.
const reusableLogger = createReusableLoggerSync(reusableLogLocation);


// do some process.
console.log("something worth logging");
reusableLogger(eligibleItemToLog);

console['logWithColor'](Colors.FgGreen, ...stuffToLog);
console['infoWithColor'](Colors.FgGreen, ...stuffToWriteToInfo);
console['errorWithColor']([Colors.FgRed, Colors.BgWhite], ...stuffToLog);
// Pass a color as the first argument, or an array of colors to change both the foreground and background.
// All colors reset at the end of the last item logged.
// This will still write the log file as expected with no changes, only stdout will be affected.
// Won't work if you haven't set up logging for that kind of logging in your loggingConfig. Eg. console["warnWithColor"] would not work. Will throw an error and crash your program.
```

You can detect if any files exist with the pattern `*.error.log`, then you'll know there's something requiring attention.

Check out the [synchronous](https://github.com/Mark-McCracken/flogger-ts/blob/master/examples/example-sync-logs.ts) and [asynchronous](https://github.com/Mark-McCracken/flogger-ts/blob/master/examples/example-async-logs.ts) examples on [github](https://github.com/Mark-McCracken/flogger-ts) 