/**
 * Created by mark.mccracken on 02/07/2017.
 */
import {Colors} from "../src/colors";
interface ConsoleLogColor { logWithColor(color: Colors | Colors[], ...items: any[]): void }
interface ConsoleInfoColor { infoWithColor(color: Colors | Colors[], ...items: any[]): void }
interface ConsoleWarnColor { warnWithColor(color: Colors | Colors[], ...items: any[]): void }
interface ConsoleErrorColor { errorWithColor(color: Colors | Colors[], ...items: any[]): void }

export type ConsoleAllColor = ConsoleLogColor & ConsoleInfoColor & ConsoleWarnColor & ConsoleErrorColor;