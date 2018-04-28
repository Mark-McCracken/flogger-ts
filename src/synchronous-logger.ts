/**
 * Created by mark.mccracken on 28/06/2017.
 */
import {LoggingConfig} from "../models/logging-config.model";
import {ReusableLog} from "../models/reusable-log.model";
import {currentTimestampString, currentTimestampStringWithSpaces} from "./current-date";
import {Colors} from "./colors";
import {LogColoredOutputPrefix} from "./prefix";
import {unusedLogTypeColors} from "./unused-log-type-coloring";
let fs = require('fs');
let path = require("path");
import * as util from "util";
let fileExistsSync = (path) => fs.existsSync(path, 'utf8');
type separators = "-" | "_" | " ";

function makeDirectoryRecursivelySync(directory: string): void {
    let parts = directory.split(path.sep);
    let subParts = parts.filter((_, idx, arr) => idx < arr.length);
    while (!fs.existsSync(subParts.join(path.sep))) {
        subParts = subParts.filter((_, idx) => idx < subParts.length - 1);
    }
    subParts.push(parts[subParts.length]);
    fs.mkdirSync(subParts.join(path.sep));
    while (subParts.length < parts.length) {
        subParts.push(parts[subParts.length]);
        fs.mkdirSync(subParts.join(path.sep));
    }
}

function makeEmptyFileSync(pathInput: string): void {
    let directory = pathInput.split(path.sep).filter((_, idx, arr) => idx < arr.length - 1).join(path.sep);
    if (directory && !fs.existsSync(directory)) makeDirectoryRecursivelySync(directory);
    fs.writeFileSync(pathInput, "", {mode: 0o777});
}

function appendItemSync(place: string, item): void {
    if (typeof item === "object") {
    	let jsonContent;
    	try {
    		jsonContent = JSON.stringify(item, null, '\t');
	    } catch(e) {
    		fs.appendFileSync(place, `ERROR! Could not stringify object. Error from stringifying object: ${JSON.stringify(e)}`);
    		jsonContent = util.inspect(item, {depth: null, colors: false, maxArrayLength: null});
	    }
    	fs.appendFileSync(place, jsonContent + "\n");
    }
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
	    let locations: string[];
	    if (config[logType].locations) locations = config[logType].locations;
	    if (config[logType].location) locations = [config[logType].location];
	    const dt = currentTimestampStringWithSpaces();
	    locations.forEach(location => {
		    if (!fileExistsSync(location)) makeEmptyFileSync(location);
		    fs.appendFileSync(location, `[${dt}] [${logType.toUpperCase()}] `);
		    items.forEach(item => appendItemSync(location, item));
	    });
    }

    Object.keys(config).forEach(logType => {
       console[logType] = (...items) => {
           if (config[logType].location || config[logType].locations) {
	           if (logType !== "error" || errorValuesExist(items)) logToFile(logType, items);
           }
           if (config[logType].printToTerminal || !(config[logType].location || config[logType].locations)) {
               let output: "stdout" | "stderr" = logType === "error" ? "stderr" : "stdout";
               LogColoredOutputPrefix(output, logType);
               items.forEach(item => {
                   if (typeof item === "object") {
	                   let jsonContent;
	                   try {
		                   jsonContent = JSON.stringify(item, null, '\t');
	                   } catch(e) {
		                   process.stdout.write(`${Colors.FgRed}ERROR! Could not stringify object. Error from stringifying object: ${JSON.stringify(e)}${Colors.Reset}\n`);
		                   jsonContent = util.inspect(item, {depth: null, colors: true, maxArrayLength: null})
	                   }
	                   process[output].write(jsonContent + Colors.Reset + "\n");
                   }
                   else process[output].write(item + Colors.Reset + "\n");
               });
           }
       };
       console[logType + "WithColor"] = (colorInput: Colors[] | Colors, ...items) => {
           if (config[logType].location || config[logType].locations) {
               if (logType !== "error" || errorValuesExist(items)) logToFile(logType, items);
           }
           let output: "stdout" | "stderr" = logType === "error" ? "stderr" : "stdout";
           LogColoredOutputPrefix(output, logType);
           Array.isArray(colorInput) ? process[output].write(colorInput.join("")) : process[output].write(colorInput);
           items.forEach(item => {
               if (typeof item === "object") {
               	let jsonContent;
               	try {
               		jsonContent = JSON.stringify(item, null, '\t');
                } catch(e) {
               		process.stdout.write(`${Colors.FgRed}ERROR! Could not stringify object. Error from stringifying object: ${JSON.stringify(e)}${Colors.Reset}\n`);
               		jsonContent = util.inspect(item, {depth: null, colors: true, maxArrayLength: null})
                }
               	process[output].write(jsonContent + Colors.Reset + "\n");
               }
               else process[output].write(item + Colors.Reset + "\n");
           });
       };
    });
    unusedLogTypeColors(config);
}

export function removeEmptyLogFilesSync(config: LoggingConfig): void {
    Object.keys(config).forEach(logType => {
       if (fileExistsSync(config[logType].location) && !(fs.readFileSync(config[logType].location, 'utf8'))) fs.unlinkSync(config[logType].location);
    });
}

export function createReusableLoggerSync(directory: string): ((item: ReusableLog) => void) {
    return (item: ReusableLog): void => {
        directory = path.resolve(directory);
        if (!fs.existsSync(directory)) makeDirectoryRecursivelySync(directory);
        let fileIndexPrefix = fs.readdirSync(directory).length.toString();
        while (fileIndexPrefix.length < 4) fileIndexPrefix = `0${fileIndexPrefix}`;
        let date = new Date();
        let timestamp = currentTimestampString({date: date});
        let fileName = `${fileIndexPrefix}_${timestamp}.reusable_log.json`;
        let pathToFile = path.join(directory, fileName);
        makeEmptyFileSync(pathToFile);
        if (!item.date) item.date = date;
        if (!item.dateString) item.dateString = currentTimestampString({date: item.date});
        appendItemSync(pathToFile, JSON.stringify(item, null, '\t'));
    }
}