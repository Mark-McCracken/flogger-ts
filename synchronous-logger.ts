/**
 * Created by mark.mccracken on 28/06/2017.
 */
import {LoggingConfig} from "./models/logging-config.model";
import {ReusableLog} from "./models/reusable-log.model";
import {currentTimestampString} from "./current-date";
import {Colors} from "./colors";
let fs = require('fs');
let path = require("path");
let fileExistsSync = (path) => fs.existsSync(path, 'utf8');
type separators = "-" | "_" | " ";

function makeDirectoryRecursivelySync(directory: string): void {
    let parts = directory.split("/");
    let subParts = parts.filter((_, idx, arr) => idx < arr.length);
    while (!fs.existsSync(subParts.join("/"))) {
        subParts = subParts.filter((_, idx) => idx < subParts.length - 1);
    }
    subParts.push(parts[subParts.length]);
    fs.mkdirSync(subParts.join("/"));
    while (subParts.length < parts.length) {
        subParts.push(parts[subParts.length]);
        fs.mkdirSync(subParts.join("/"));
    }
}

function makeEmptyFileSync(path: string): void {
    let directory = path.split("/").filter((_, idx, arr) => idx < arr.length - 1).join("/");
    if (directory && !fs.existsSync(directory)) makeDirectoryRecursivelySync(directory);
    fs.writeFileSync(path, "");
}

function appendItemSync(place: string, item): void {
    if (typeof item === "object") fs.appendFileSync(place, JSON.stringify(item) + "\n");
    else fs.appendFileSync(place, item + "\n");
}

export function redirectLoggingToFilesSync(config: LoggingConfig): void {
    let errorValuesExist;
    if (config.error) {
        errorValuesExist = (items: any[]) => {
            return items.length && items.some(i => {
                    if (typeof i === "number") return true;
                    if (typeof i === "boolean") return true;
                    if (i === undefined || i === null) return false;
                    if (i.hasOwnProperty('length') && i.length === 0) return false;
                    if (typeof i === "object" && Object.keys(i).length === 0) return false;
                    return Boolean(i);
                });
        };
    }
    function logToFile(logType, items) {
        if (!fileExistsSync(config[logType].location)) makeEmptyFileSync(config[logType].location);
        fs.appendFileSync(config[logType].location, `[${new Date()}] [${logType.toUpperCase()}] \n`);
        items.forEach(item => appendItemSync(config[logType].location, item));
    }
    Object.keys(config).forEach(logType => {
       console[logType] = (...items) => {
           if (logType !== "error" || errorValuesExist(items)) logToFile(logType, items);
           if (config[logType].printToTerminal) {
               items.forEach(item => {
                   let output = logType === "error" ? "stderr" : "stdout";
                   if (typeof item === "object") process[output].write(JSON.stringify(item) + "\n");
                   else process[output].write(item + "\n");
               });
           }
       };
       console[logType + "WithColor"] = (colorInput: Colors[] | Colors, ...items) => {
               if (logType !== "error" || errorValuesExist(items)) logToFile(logType, items);
               let output = logType === "error" ? "stderr" : "stdout";
               Array.isArray(colorInput) ? process[output].write(colorInput.join("")) : process[output].write(colorInput);
               items.forEach(item => {
                   if (typeof item === "object") process[output].write(JSON.stringify(item) + "\n");
                   else process[output].write(item + "\n");
               });
               process[output].write(Colors.Reset);
       };
    });
}

export function removeEmptyLogFilesSync(config: LoggingConfig): void {
    Object.keys(config).forEach(logType => {
       if (fileExistsSync(config[logType].location) && !(fs.readFileSync(config[logType].location, 'utf8'))) fs.unlinkSync(config[logType].location);
    });
}

export function createReusableLoggerSync(directory: string): ((item: ReusableLog) => void) {
    return (item: ReusableLog): void => {
        if (directory[directory.length - 1] === "/") directory = directory.substr(0, directory.length - 1);
        if (!fs.existsSync(directory)) makeDirectoryRecursivelySync(directory);
        let fileIndexPrefix = fs.readdirSync(directory).length.toString();
        while (fileIndexPrefix.length < 4) fileIndexPrefix = `0${fileIndexPrefix}`;
        let date = new Date();
        let timestamp = currentTimestampString({separator: "_", date: date});
        let fileName = `${fileIndexPrefix}_${timestamp}.reusable_log.json`;
        let pathToFile = `${directory}/${fileName}`;
        makeEmptyFileSync(pathToFile);
        if (!item.date) item.date = date;
        if (!item.dateString) item.dateString = currentTimestampString({date: item.date});
        appendItemSync(pathToFile, JSON.stringify(item));
    }
}