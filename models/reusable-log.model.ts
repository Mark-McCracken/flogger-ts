/**
 * Created by mark.mccracken on 01/07/2017.
 */
export interface ReusableLog {
    date?: Date;
    dateString?: string;
    error?: string;
    values?: any[];
    query?: string;
    additionalDetails?: object;
}