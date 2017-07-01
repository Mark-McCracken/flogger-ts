/**
 * Created by mark.mccracken on 02/07/2017.
 */
import {Colors} from "./colors";
import {currentTimestampString} from "./current-date";

export function LogColoredOutputPrefix(output: "stdout" | "stderr", logType: string): void {
    let color: Colors;
    switch(logType) {
        case "log": color = Colors.FgGreen; break;
        case "info": color = Colors.FgBlue; break;
        case "error": color = Colors.FgRed; break;
        case "warn" : color = Colors.FgYellow; break;
        default: color = Colors.FgMagenta;
    }
    process[output].write(`${color}[${currentTimestampString()}] [${logType.toUpperCase()}]${Colors.Reset} `);
}