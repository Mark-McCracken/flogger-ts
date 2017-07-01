Object.defineProperty(exports, "__esModule", { value: true });
const current_date_1 = require("./current-date");
const colors_1 = require("./colors");
let fs = require('fs');
let path = require("path");
let fileExistsSync = (path) => fs.existsSync(path, 'utf8');
function makeDirectoryRecursivelySync(directory) {
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
function makeEmptyFileSync(path) {
    let directory = path.split("/").filter((_, idx, arr) => idx < arr.length - 1).join("/");
    if (directory && !fs.existsSync(directory))
        makeDirectoryRecursivelySync(directory);
    fs.writeFileSync(path, "");
}
function appendItemSync(place, item) {
    if (typeof item === "object")
        fs.appendFileSync(place, JSON.stringify(item) + "\n");
    else
        fs.appendFileSync(place, item + "\n");
}
function redirectLoggingToFilesSync(config) {
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
        if (!fileExistsSync(config[logType].location))
            makeEmptyFileSync(config[logType].location);
        fs.appendFileSync(config[logType].location, `[${new Date()}] [${logType.toUpperCase()}] \n`);
        items.forEach(item => appendItemSync(config[logType].location, item));
    }
    Object.keys(config).forEach(logType => {
        console[logType] = (...items) => {
            if (logType !== "error" || errorValuesExist(items))
                logToFile(logType, items);
            if (config[logType].printToTerminal) {
                items.forEach(item => {
                    let output = logType === "error" ? "stderr" : "stdout";
                    if (typeof item === "object")
                        process[output].write(JSON.stringify(item) + "\n");
                    else
                        process[output].write(item + "\n");
                });
            }
        };
        console[logType + "WithColor"] = (colorInput, ...items) => {
            if (logType !== "error" || errorValuesExist(items))
                logToFile(logType, items);
            let output = logType === "error" ? "stderr" : "stdout";
            Array.isArray(colorInput) ? process[output].write(colorInput.join("")) : process[output].write(colorInput);
            items.forEach(item => {
                if (typeof item === "object")
                    process[output].write(JSON.stringify(item) + "\n");
                else
                    process[output].write(item + "\n");
            });
            process[output].write(colors_1.Colors.Reset);
        };
    });
}
exports.redirectLoggingToFilesSync = redirectLoggingToFilesSync;
function removeEmptyLogFilesSync(config) {
    Object.keys(config).forEach(logType => {
        if (fileExistsSync(config[logType].location) && !(fs.readFileSync(config[logType].location, 'utf8')))
            fs.unlinkSync(config[logType].location);
    });
}
exports.removeEmptyLogFilesSync = removeEmptyLogFilesSync;
function createReusableLoggerSync(directory) {
    return (item) => {
        if (directory[directory.length - 1] === "/")
            directory = directory.substr(0, directory.length - 1);
        if (!fs.existsSync(directory))
            makeDirectoryRecursivelySync(directory);
        let fileIndexPrefix = fs.readdirSync(directory).length.toString();
        while (fileIndexPrefix.length < 4)
            fileIndexPrefix = `0${fileIndexPrefix}`;
        let date = new Date();
        let timestamp = current_date_1.currentTimestampString({ separator: "_", date: date });
        let fileName = `${fileIndexPrefix}_${timestamp}.reusable_log.json`;
        let pathToFile = `${directory}/${fileName}`;
        makeEmptyFileSync(pathToFile);
        if (!item.date)
            item.date = date;
        if (!item.dateString)
            item.dateString = current_date_1.currentTimestampString({ date: item.date });
        appendItemSync(pathToFile, JSON.stringify(item));
    };
}
exports.createReusableLoggerSync = createReusableLoggerSync;
