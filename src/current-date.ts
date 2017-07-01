/**
 * Created by mark.mccracken on 01/07/2017.
 */

type separators = "-" | "_" | " ";
export const currentTimestampString = (config?: {separator?: separators, date?: Date}): string => {
    let now: Date;
    let sep: separators;
    if (config) {
        now = config.date || new Date();
        sep = config.separator || " ";
    }
    if (!now) now = new Date();
    if (!sep) sep = " ";
    let appendZero = (num: number) => `${num < 10 ? "0" : ""}${num}`;
    return `${now.getFullYear()}-${appendZero(now.getMonth()+1)}-${appendZero(now.getDate())}${sep}${appendZero(now.getHours())}:${appendZero(now.getMinutes())}:${appendZero(now.getSeconds())}`
};
export const currentDateString = (date?: Date): string => {
    let now: Date = date || new Date();
    let appendZero = (num: number) => `${num < 10 ? "0" : ""}${num}`;
    return `${now.getFullYear()}-${appendZero(now.getMonth()+1)}-${appendZero(now.getDate())}`;
};