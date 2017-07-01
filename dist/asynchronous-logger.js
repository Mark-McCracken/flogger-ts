var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const current_date_1 = require("./current-date");
const colors_1 = require("./colors");
let fs = require('fs');
let path = require("path");
let _exists = (path) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve) => {
        fs.access(path, 'utf8', (err) => {
            resolve(!err);
        });
    });
});
let exists = (path) => __awaiter(this, void 0, void 0, function* () {
    let exists;
    try {
        exists = yield _exists(path);
    }
    catch (e) {
        console.error(`Error in checking for existence of file`);
        console.error(e);
    }
    return exists;
});
let _mkdir = (directory) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        fs.mkdir(directory, (err) => {
            if (err)
                reject(err);
            resolve();
        });
    });
});
let mkdir = (directory) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield _mkdir(directory);
    }
    catch (e) {
        if (e['Error'].contains("EEXIST"))
            throw e;
        console.error(`Error 0 in making directory ${directory}, error: ${e}`);
    }
    return;
});
let _readdir = (directory) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve) => {
        fs.readdir(directory, (err, files) => {
            if (err) {
                console.error(`error reading directory`);
                console.error(err);
            }
            resolve(files);
        });
    });
});
let readdir = (directory) => __awaiter(this, void 0, void 0, function* () {
    let contents;
    try {
        contents = yield _readdir(directory);
    }
    catch (e) {
        console.error(`error in reading directory ${directory}`);
        console.error(`e`);
    }
    return contents;
});
let _readFile = (location) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        fs.readFile(location, 'utf8', (err, contents) => {
            resolve(contents);
        });
    });
});
let readFile = (location) => __awaiter(this, void 0, void 0, function* () {
    let contents;
    try {
        contents = yield _readFile(location);
    }
    catch (e) {
        console.error(`error in reading file from ${location}`);
        console.error(e);
    }
    return contents;
});
let _appendFile = (location, contents) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        fs.appendFile(location, contents, (err) => {
            if (err) {
                console.error(err);
                reject();
            }
            resolve();
        });
    });
});
let appendFile = (location, contents) => __awaiter(this, void 0, void 0, function* () {
    return yield _appendFile(location, contents);
});
function makeDirectoryRecursively(directory) {
    return __awaiter(this, void 0, void 0, function* () {
        let parts = directory.split("/");
        let subParts = parts.filter((_, idx, arr) => idx < arr.length);
        let existing;
        try {
            existing = yield exists(subParts.join("/"));
        }
        catch (e) {
            console.error(`Error in checking file existence ${subParts.join("/")}`);
            console.error(e);
        }
        while (!existing) {
            subParts = subParts.filter((_, idx) => idx < subParts.length - 1);
            try {
                existing = yield exists(subParts.join("/"));
            }
            catch (e) {
                console.error(`Error in checking file existence ${subParts.join("/")}`);
                console.error(e);
            }
        }
        subParts.push(parts[subParts.length]);
        try {
            yield mkdir(subParts.join("/"));
        }
        catch (e) { }
        while (subParts.length < parts.length) {
            subParts.push(parts[subParts.length]);
            try {
                yield mkdir(subParts.join("/"));
            }
            catch (e) { }
        }
    });
}
function makeEmptyFile(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let directory = path.split("/").filter((_, idx, arr) => idx < arr.length - 1).join("/");
            let directoryExists;
            try {
                directoryExists = yield exists(directory);
            }
            catch (e) {
                console.error(`Error checking existence of directory ${directory}`);
                console.error(e);
            }
            if (directory && !(directoryExists)) {
                try {
                    yield makeDirectoryRecursively(directory);
                }
                catch (e) {
                    console.error(`error in making directory recursively, directory: ${directory}`);
                    console.error(e);
                }
            }
            fs.writeFile(path, "", (err) => {
                if (err) {
                    console.error(`Error in creating empty file ${path}`);
                    console.error(err);
                    reject(err);
                }
                resolve();
            });
        }));
    });
}
function appendItem(location, item) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof item === "object")
            yield appendFile(location, JSON.stringify(item) + "\n");
        else
            yield appendFile(location, item + "\n");
    });
}
function redirectLoggingToFiles(config) {
    let errorValuesExist;
    if (config.error) {
        errorValuesExist = (items) => {
            return items.length && items.some(i => {
                if (typeof i === "number")
                    return true;
                if (typeof i === "boolean")
                    return true;
                if (i === undefined || i === null)
                    return false;
                if (i.hasOwnProperty('length') && i.length === 0)
                    return false;
                if (typeof i === "object" && Object.keys(i).length === 0)
                    return false;
                return Boolean(i);
            });
        };
    }
    function logToFile(logType, items) {
        return __awaiter(this, void 0, void 0, function* () {
            let logFileExists;
            try {
                logFileExists = yield exists(config[logType].location);
            }
            catch (e) {
                console.log(`error: log file does not exist`);
                console.error(e);
            }
            if (!logFileExists) {
                try {
                    yield makeEmptyFile(config[logType].location);
                }
                catch (e) {
                    console.error("error in making empty file");
                }
            }
            try {
                yield appendFile(config[logType].location, `[${new Date()}] [${logType.toUpperCase()}] \n`);
            }
            catch (e) {
                console.error(`error in appending file`);
                console.error(e);
            }
            items.forEach((item) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield appendItem(config[logType].location, item);
                }
                catch (e) {
                    console.error(`err in appending item`);
                    console.error(e);
                }
            }));
        });
    }
    Object.keys(config).forEach(logType => {
        console[logType] = (...items) => __awaiter(this, void 0, void 0, function* () {
            if (logType !== "error" || errorValuesExist(items)) {
                try {
                    yield logToFile(logType, items);
                }
                catch (e) {
                    console.error(`Error logging to file.`);
                    console.error(e);
                }
            }
            if (config[logType].printToTerminal) {
                items.forEach(item => {
                    let output = logType === "error" ? "stderr" : "stdout";
                    if (typeof item === "object")
                        process[output].write(JSON.stringify(item) + "\n");
                    else
                        process[output].write(item + "\n");
                });
            }
        });
        console[logType + "WithColor"] = (colorInput, ...items) => __awaiter(this, void 0, void 0, function* () {
            if (logType !== "error" || errorValuesExist(items)) {
                try {
                    yield logToFile(logType, items);
                }
                catch (e) {
                    console.error(`Error logging to file.`);
                    console.error(e);
                }
            }
            let output = logType === "error" ? "stderr" : "stdout";
            Array.isArray(colorInput) ? process[output].write(colorInput.join("")) : process[output].write(colorInput);
            items.forEach(item => {
                if (typeof item === "object")
                    process[output].write(JSON.stringify(item) + "\n");
                else
                    process[output].write(item + "\n");
            });
            process[output].write(colors_1.Colors.Reset);
        });
    });
}
exports.redirectLoggingToFiles = redirectLoggingToFiles;
function removeEmptyLogFiles(config) {
    return __awaiter(this, void 0, void 0, function* () {
        Object.keys(config).forEach((logType) => __awaiter(this, void 0, void 0, function* () {
            let logFileExists;
            try {
                logFileExists = yield exists(config[logType].location);
            }
            catch (e) {
                console.error(`error in checking for file existence`);
                console.error(e);
            }
            let fileContents;
            if (logFileExists) {
                try {
                    fileContents = yield readFile(config[logType].location);
                }
                catch (e) {
                    console.error(`error in reading file contents`);
                    console.error(e);
                }
            }
            if (logFileExists && !fileContents)
                fs.unlink(config[logType].location, (err) => {
                    if (err) {
                        console.error(`error in deleting file`);
                        console.error(err);
                    }
                });
        }));
    });
}
exports.removeEmptyLogFiles = removeEmptyLogFiles;
class ReusableLogger {
    constructor(directory) {
        this.pendingItems = 0;
        this.log = (item) => __awaiter(this, void 0, void 0, function* () {
            if (this.directory[this.directory.length - 1] === "/")
                this.directory = this.directory.substr(0, this.directory.length - 1);
            if (!(yield exists(this.directory)))
                yield makeDirectoryRecursively(this.directory);
            let fileIndexPrefix = ((yield readdir(this.directory)).length + this.pendingItems++).toString();
            while (fileIndexPrefix.length < 4)
                fileIndexPrefix = `0${fileIndexPrefix}`;
            let date = new Date();
            let timestamp = current_date_1.currentTimestampString({ separator: "_", date: date });
            let fileName = `${fileIndexPrefix}_${timestamp}.reusable_log.json`;
            let pathToFile = `${this.directory}/${fileName}`;
            yield makeEmptyFile(pathToFile);
            item.date = date;
            item.dateString = current_date_1.currentTimestampString({ date: date });
            yield appendItem(pathToFile, JSON.stringify(item));
            this.pendingItems--;
        });
        this.directory = directory;
    }
}
exports.ReusableLogger = ReusableLogger;
