/**
 * Created by mark.mccracken on 01/07/2017.
 */
import {LoggingConfig} from "../models/logging-config.model";
import {ReusableLog} from "../models/reusable-log.model";
import {currentTimestampString} from "./current-date";
import {Colors} from "./colors";
import {LogColoredOutputPrefix} from "./prefix";
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
    let parts = directory.split("/");
    let subParts = parts.filter((_, idx, arr) => idx < arr.length);

    let existing;
    try { existing = await exists(subParts.join("/")) } catch (e) { console.error(`Error in checking file existence ${subParts.join("/")}`); console.error(e); }
    while (!existing) {
        subParts = subParts.filter((_, idx) => idx < subParts.length - 1);
        try { existing = await exists(subParts.join("/")) } catch (e) { console.error(`Error in checking file existence ${subParts.join("/")}`); console.error(e); }
    }
    subParts.push(parts[subParts.length]);
    try { await mkdir(subParts.join("/")); } catch (e) {  }
    while (subParts.length < parts.length) {
        subParts.push(parts[subParts.length]);
        try { await mkdir(subParts.join("/")); } catch (e) {  }
    }
}

async function makeEmptyFile(path: string) {
    return new Promise(async (resolve, reject) => {
        let directory = path.split("/").filter((_, idx, arr) => idx < arr.length - 1).join("/");
        let directoryExists;
        try { directoryExists = await exists(directory); } catch (e) { console.error(`Error checking existence of directory ${directory}`); console.error(e); }
        if (directory && !(directoryExists)) {
            try { await makeDirectoryRecursively(directory); } catch(e) { console.error(`error in making directory recursively, directory: ${directory}`); console.error(e); }
        }
        fs.writeFile(path, "", (err) => {
            if (err) {
                console.error(`Error in creating empty file ${path}`);
                console.error(err);
                reject(err);
            }
            resolve();
        });
    });
}


async function appendItem(location: string, item) {
    if (typeof item === "object") await appendFile(location, JSON.stringify(item) + "\n");
    else await appendFile(location, item + "\n");
}

export function redirectLoggingToFiles(config: LoggingConfig): void {
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
    async function logToFile(logType, items) {
        let logFileExists;
        try {
            logFileExists = await exists(config[logType].location);
        } catch (e) {
            console.log(`error: log file does not exist`);
            console.error(e)
        }
        if (!logFileExists) {
            try { await makeEmptyFile(config[logType].location); } catch (e) { console.error("error in making empty file"); }
        }
        try { await appendFile(config[logType].location, `[${new Date()}] [${logType.toUpperCase()}] `); } catch (e) { console.error(`error in appending file`); console.error(e); }
        items.forEach(async (item) => {
            try { await appendItem(config[logType].location, item); } catch (e) { console.error(`err in appending item`); console.error(e); }
        });
    }
    Object.keys(config).forEach(logType => {
        console[logType] = async (...items) => {
            if (logType !== "error" || errorValuesExist(items)) {
                try { await logToFile(logType, items); } catch(e) { console.error(`Error logging to file.`); console.error(e) }
            }
            if (config[logType].printToTerminal) {
                let output: "stdout" | "stderr" = logType === "error" ? "stderr" : "stdout";
                LogColoredOutputPrefix(output, logType);
                items.forEach(item => {
                    if (typeof item === "object") process[output].write(JSON.stringify(item) + "\n");
                    else process[output].write(item + "\n");
                });
            }
        };
        console[logType + "WithColor"] = async (colorInput: Colors[] | Colors, ...items) => {
            if (logType !== "error" || errorValuesExist(items)) {
                try { await logToFile(logType, items); } catch(e) { console.error(`Error logging to file.`); console.error(e) }
            }
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
        this.directory = directory;
    }
    private directory: string;
    private pendingItems: number = 0;

    log = async (item: ReusableLog) => {
        if (this.directory[this.directory.length - 1] === "/") this.directory = this.directory.substr(0, this.directory.length - 1);
        if (!(await exists(this.directory))) await makeDirectoryRecursively(this.directory);
        let fileIndexPrefix = ((await readdir(this.directory)).length + this.pendingItems++).toString();
        while (fileIndexPrefix.length < 4) fileIndexPrefix = `0${fileIndexPrefix}`;
        let date = new Date();
        let timestamp = currentTimestampString({separator: "_", date: date});
        let fileName = `${fileIndexPrefix}_${timestamp}.reusable_log.json`;
        let pathToFile = `${this.directory}/${fileName}`;
        await makeEmptyFile(pathToFile);
        item.date = date;
        item.dateString = currentTimestampString({date: date});
        await appendItem(pathToFile, JSON.stringify(item));
        this.pendingItems--;
    };

}