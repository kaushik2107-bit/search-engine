import fs from "fs";
import readline from "readline";

export type T_SITE = {
    url: string;
    rank: number;
}

const SITE_LIMIT = 1;

export default async function loader(filepath: string): Promise<T_SITE[]> {
    const fileStream = fs.createReadStream(filepath);
    const rl = readline.createInterface({
        input: fileStream
    })

    let index = 1;
    let sites:T_SITE[] = []
    for await (const line of rl) {
        const url = "https://" + line;
        sites.push({url, rank:index} as T_SITE);
        
        index += 1;
        if (index > SITE_LIMIT) break;
    }

    return sites;
}