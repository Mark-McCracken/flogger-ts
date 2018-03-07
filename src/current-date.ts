/**
 * Created by mark.mccracken on 01/07/2017.
 */

export const currentTimestampString = (config?: {date?: Date}): string => {
	let now: Date;
	if (config) {
		now = config.date || new Date();
	}
	if (!now) now = new Date();
	let appendZero = (num: number) => `${num < 10 ? "0" : ""}${num}`;
	return `${now.getFullYear()}${appendZero(now.getMonth()+1)}${appendZero(now.getDate())}T${appendZero(now.getHours())}${appendZero(now.getMinutes())}${appendZero(now.getSeconds())}`
};
export const currentTimestampStringWithSpaces = (config?: {date?: Date}): string => {
	let now: Date;
	if (config) {
		now = config.date || new Date();
	}
	if (!now) now = new Date();
	let appendZero = (num: number) => `${num < 10 ? "0" : ""}${num}`;
	return `${now.getFullYear()}-${appendZero(now.getMonth()+1)}-${appendZero(now.getDate())} ${appendZero(now.getHours())}:${appendZero(now.getMinutes())}:${appendZero(now.getSeconds())}`
};
export const currentDateString = (date?: Date): string => {
    let now: Date = date || new Date();
    let appendZero = (num: number) => `${num < 10 ? "0" : ""}${num}`;
    return `${now.getFullYear()}${appendZero(now.getMonth()+1)}${appendZero(now.getDate())}`;
};