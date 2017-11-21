/**
 * Created by mark.mccracken on 02/07/2017.
 */
import {Colors} from "./colors";
import {LogColoredOutputPrefix} from "./prefix";
export function unusedLogTypeColors (config) {
    let unusedLogTypes = ["log", "info", "warn", "error"].filter(item => !(Object.keys(config).includes(item)));
    unusedLogTypes.forEach(unusedLogType => {
        console[unusedLogType + "WithColor"] = (colorInput: Colors[] | Colors, ...items) => {
            let output: "stderr" | "stdout" = unusedLogType === "error" ? "stderr" : "stdout";
            LogColoredOutputPrefix(output, unusedLogType);
            Array.isArray(colorInput) ? process[output].write(colorInput.join("")) : process[output].write(colorInput);
            items.forEach(item => {
                if (typeof item === "object") process[output].write(JSON.stringify(item) + Colors.Reset + "\n");
                else process[output].write(item + Colors.Reset + "\n");
            });
        };
    });
}