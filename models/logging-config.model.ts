/**
 * Created by mark.mccracken on 01/07/2017.
 */

interface LogItemValues {
    location: string;
    printToTerminal: boolean;
}
export interface LoggingConfig {
    info?: LogItemValues;
    log?: LogItemValues;
    error?: LogItemValues;
    warn?: LogItemValues;
}