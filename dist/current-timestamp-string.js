/**
 * Created by mark.mccracken on 01/07/2017.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentTimestampString = (config) => {
    let now;
    let sep;
    if (config) {
        now = config.date || new Date();
        sep = config.separator || " ";
    }
    if (!now)
        now = new Date();
    if (!sep)
        sep = " ";
    let appendZero = (num) => `${num < 10 ? "0" : ""}${num}`;
    return `${now.getFullYear()}-${appendZero(now.getMonth() + 1)}-${appendZero(now.getDate())}${sep}${appendZero(now.getHours())}:${appendZero(now.getMinutes())}:${appendZero(now.getSeconds())}`;
};
exports.currentDateString = (date) => {
    let now = date || new Date();
    let appendZero = (num) => `${num < 10 ? "0" : ""}${num}`;
    return `${now.getFullYear()}-${appendZero(now.getMonth() + 1)}-${appendZero(now.getDate())}`;
};
