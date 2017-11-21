/**
 * Created by mark.mccracken on 01/07/2017.
 */

interface LogItemValues {
    location?: string;
    printToTerminal?: boolean;
}
interface LogItemValuesMultiLog {
	locations: string[];
	printToTerminal?: boolean;
}
type config = LogItemValues | LogItemValuesMultiLog;
export interface LoggingConfig {
    info?: config;
    log?: config;
    error?: config;
    warn?: config;
}