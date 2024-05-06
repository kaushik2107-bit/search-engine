import { crawler } from "./crawler/crawler"
import fs from "fs";
import util from "util"; 
import applyPagerank from "./pagerank/pr";
import searchQuery from "./searcher/search";

const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
].join('|');

const regex = new RegExp(pattern, 'g');

// move new-logs.txt to old-logs.txt first
const logDir = 'logs';
const newLogFile = `${logDir}/new-logs.txt`;
const oldLogFile = `${logDir}/old-logs.txt`;

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

if (fs.existsSync(newLogFile)) {
    fs.renameSync(newLogFile, oldLogFile);
}

const logFile = fs.createWriteStream('logs/new-logs.txt', {flags: 'a'});
const logStdout = process.stdout;

console.log = function(mess) {
    const now = new Date();
    const timestamp = `[${now.toLocaleString()}]`;
    const logMessage = `${timestamp} ${util.format(mess)}`;
    logFile.write((util.format(logMessage)+'\n').replace(regex, ''));
    logStdout.write(util.format(logMessage)+'\n');
}

async function main() {
    // await crawler();
    // console.log("[DONE]: Crawling done\n");

    // await applyPagerank();

    const query = "a the";
    const scores = await searchQuery(query);
    console.log(scores);
}
main();