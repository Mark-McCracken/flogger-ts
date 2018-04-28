/**
 * Created by mark.mccracken on 01/07/2017.
 */
import {LoggingConfig} from "../models/logging-config.model";
import {ReusableLog} from "../models/reusable-log.model";
import {currentTimestampString, currentTimestampStringWithSpaces} from "./current-date";
import {Colors} from "./colors";
import {LogColoredOutputPrefix} from "./prefix";
import {unusedLogTypeColors} from "./unused-log-type-coloring";
import * as util from "util";
let fs = require('fs');
let path = require("path");

let _exists = async (path) => {
    return new Promise((resolve) => {
        fs.access(path, 'utf8', (err) => {
            resolve(!err);
        });
    });
};
let exists = async (path: string) => {
    let exists;
    try { exists = await _exists(path); } catch (e) { console.error(`Error in checking for existence of file`); console.error(e); }
    return exists;
};

let _mkdir = async (directory: string) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(directory, (err) => {
            if (err) reject(err);
            resolve()
        })
    });
};
let mkdir = async (directory: string) => {
    try { await _mkdir(directory); } catch(e) {
        if (e['Error'].contains("EEXIST")) throw e;
        console.error(`Error 0 in making directory ${directory}, error: ${e}`);
    }
    return;
};

let _readdir = async (directory): Promise<any> => {
    return new Promise((resolve) => {
        fs.readdir(directory, (err, files) => {
            if (err) {
                console.error(`error reading directory`);
                console.error(err);
            }
            resolve(files as string[]);
        })
    });
};
let readdir = async (directory): Promise<string[]> => {
    let contents;
    try { contents = await _readdir(directory) } catch (e) { console.error(`error in reading directory ${directory}`); console.error(`e`); }
    return contents;
};

let _readFile = async (location: string) => {
    return new Promise((resolve, reject) => {
        fs.readFile(location, 'utf8', (err, contents) => {
            resolve(contents);
        });
    });
};
let readFile = async (location) => {
    let contents;
    try { contents = await _readFile(location); } catch (e) { console.error(`error in reading file from ${location}`); console.error(e); }
    return contents;
};

let _appendFile = async (location, contents) => {
    return new Promise((resolve, reject) => {
        fs.appendFile(location, contents, (err) => {
            if (err) {
                console.error(err);
                reject();
            }
            resolve();
        });
    });
};
let appendFile = async (location, contents) => {
    return await _appendFile(location, contents);
};


async function makeDirectoryRecursively(directory: string) {
    let parts = directory.split(path.sep);
    let subParts = parts.filter((_, idx, arr) => idx < arr.length);

    let existing;
    try { existing = await exists(subParts.join(path.sep)) } catch (e) { console.error(`Error in checking file existence ${subParts.join(path.sep)}`); console.error(e); }
    while (!existing) {
        subParts = subParts.filter((_, idx) => idx < subParts.length - 1);
        try { existing = await exists(subParts.join(path.sep)) } catch (e) { console.error(`Error in checking file existence ${subParts.join(path.sep)}`); console.error(e); }
    }
    subParts.push(parts[subParts.length]);
    try { await mkdir(subParts.join(path.sep)); } catch (e) {  }
    while (subParts.length < parts.length) {
        subParts.push(parts[subParts.length]);
        try { await mkdir(subParts.join(path.sep)); } catch (e) {  }
    }
}

async function makeEmptyFile(pathInput: string) {
    return new Promise(async (resolve, reject) => {
        let directory = pathInput.split(path.sep).filter((_, idx, arr) => idx < arr.length - 1).join(path.sep);
        let directoryExists;
        try { directoryExists = await exists(directory); } catch (e) { console.error(`Error checking existence of directory ${directory}`); console.error(e); }
        if (directory && !(directoryExists)) {
            try { await makeDirectoryRecursively(directory); } catch(e) { console.error(`error in making directory recursively, directory: ${directory}`); console.error(e); }
        }
        fs.writeFile(pathInput, "", {mode: 0o777}, (err) => {
            if (err) {
                console.error(`Error in creating empty file ${pathInput}`);
                console.error(err);
                reject(err);
            }
            resolve();
        });
    });
}

function safeStringify(item: object, colors: boolean = true): string {
	try {
		return JSON.stringify(item, null, '\t');
	} catch(e) {
		return util.inspect(item, {depth: null, colors, maxArrayLength: null});
	}
}

async function appendItemWithTimestamp(location: string, logType, item) {
		const dt = currentTimestampStringWithSpaces();
    if (typeof item === "object") await appendFile(location, `[${dt}] [${logType.toUpperCase()}] ${safeStringify(item, false)}\n`);
    else await appendFile(location, `[${dt}] [${logType.toUpperCase()}] ${item + "\n"}`);
}
async function appendItem(location: string, item) {
    if (typeof item === "object") await appendFile(location, safeStringify(item, false));
    else await appendFile(location, item);
}

export function redirectLoggingToFiles(config: LoggingConfig): void {
    let errorValuesExist;
    if (config.error) {
        errorValuesExist = (items: any[]) => {
            return items.length && items.some(i => {
                    if (typeof i === "number") return true;
                    if (typeof i === "boolean") return true;
                    if (i === undefined || i === null) return false;
                    if (Array.isArray(i) && i.length === 0) return false;
                    if (typeof i === "object" && Object.keys(i).length === 0) return false;
                    return Boolean(i);
                });
        };
    }
    async function logToFile(logType, items) {
    	let locations: string[];
    	if (config[logType].locations) locations = config[logType].locations;
    	if (config[logType].location)  locations = [config[logType].location];
        locations.forEach(async location => {
		    let logFileExists;
		    try {
			    logFileExists = await exists(location);
		    } catch (e) {
			    console.error(`error: could not check if file exists`);
			    console.error(e);
		    }
		    if (!logFileExists) {
			    try { await makeEmptyFile(location); } catch (e) { console.error("error in making empty file"); }
		    }
		    items.forEach(async (item) => {
			    try { await appendItemWithTimestamp(location, logType, item); } catch (e) { console.error(`err in appending item with timestamp`); console.error(e); }
		    });
	    });
    }
    async function checkAndLogToLocation(logType, items) {
        if (config[logType].location || (config[logType].locations && config[logType].locations.length)) {
            if (logType !== "error" || errorValuesExist(items)) {
                try { await logToFile(logType, items); } catch(e) { console.error(`Error 0 logging to file.`); console.error(e) }
            }
        }
    }
    Object.keys(config).forEach(logType => {
        console[logType] = async (...items) => {
            try { await checkAndLogToLocation(logType, items); } catch (e) { console.error(`Error 1 logging to file`); console.error(e) }
            if (config[logType].printToTerminal || !(config[logType].location || config[logType].locations)) {
                let output: "stdout" | "stderr" = logType === "error" ? "stderr" : "stdout";
                LogColoredOutputPrefix(output, logType);
                items.forEach(item => {
                    if (typeof item === "object") process[output].write(safeStringify(item) + Colors.Reset + "\n");
                    else process[output].write(item + Colors.Reset + "\n");
                });
            }
        };
        console[logType + "WithColor"] = async (colorInput: Colors[] | Colors, ...items) => {
            try { await checkAndLogToLocation(logType, items); } catch (e) { console.error(`Error 1 logging to file`); console.error(e) }
            let output: "stderr" | "stdout" = logType === "error" ? "stderr" : "stdout";
            LogColoredOutputPrefix(output, logType);
            Array.isArray(colorInput) ? process[output].write(colorInput.join("")) : process[output].write(colorInput);
            items.forEach(item => {
                if (typeof item === "object") process[output].write(JSON.stringify(item, null, '\t') + Colors.Reset + "\n");
                else process[output].write(item + Colors.Reset + "\n");
            });
        };
    });
    unusedLogTypeColors(config);
}

export async function removeEmptyLogFiles(config: LoggingConfig) {
    Object.keys(config).forEach(async (logType) => {
        let logFileExists;
        try { logFileExists = await exists(config[logType].location) } catch (e) { console.error(`error in checking for file existence`); console.error(e); }
        let fileContents;
        if (logFileExists) {
            try { fileContents = await readFile(config[logType].location); } catch (e) { console.error(`error in reading file contents`); console.error(e); }
        }
        if (logFileExists && !fileContents) fs.unlink(config[logType].location, (err) => {
            if (err) {
                console.error(`error in deleting file`);
                console.error(err);
            }
        });
    });
}

export class ReusableLogger {
    constructor(directory: string) {
        this.directory = path.resolve(directory);
    }
    private directory: string;
    private pendingItems: number = 0;

    log = async (item: ReusableLog) => {
        if (!(await exists(this.directory))) await makeDirectoryRecursively(this.directory);
        let fileIndexPrefix = ((await readdir(this.directory)).length + this.pendingItems++).toString();
        while (fileIndexPrefix.length < 4) fileIndexPrefix = `0${fileIndexPrefix}`;
                                                                //TODO use left pad instead
        let date = new Date();
        let timestamp = currentTimestampString({date: date});
        let fileName = `${fileIndexPrefix}_${timestamp}.reusable_log.json`;
        let pathToFile = path.join(this.directory, fileName);
        await makeEmptyFile(pathToFile);
        item.date = date;
        item.dateString = currentTimestampStringWithSpaces({date: date});
        await appendItem(pathToFile, item);
        this.pendingItems--;
    };
}