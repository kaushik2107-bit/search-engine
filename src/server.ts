import express from "express";
import searchQuery from "./searcher/search";
import { fetchWebsite } from "./database/tfidf";
import schedule from "node-schedule";
import { crawler } from "./crawler/crawler";
import applyPagerank from "./pagerank/pr";
import chalk from "chalk";


const app = express();
const port = 3000;

async function runTasks(scheduledJob: schedule.Job) {
    console.log(chalk.white("[INFO]: Running scheduled tasks"));

    const stopTimeout = setTimeout(() => {
        console.log(chalk.bgBlueBright("[STOP]: Stopping scheduled tasks after 5 minutes"));
        scheduledJob.cancel();
    }, 5 * 60 * 1000);

    try {
        await crawler();
        console.log(chalk.bgCyan("[DONE]: Crawling done"));

        clearTimeout(stopTimeout);

        await applyPagerank();
        console.log(chalk.bgCyan("[DONE]: PageRank computation done"));
    } catch (error) {
        console.error(chalk.bgRed("[ERROR]: Job failed", error));
    } finally {
        clearTimeout(stopTimeout);
    }
}

const scheduledJob = schedule.scheduleJob('0 0 */2 * *', function () {
    runTasks(scheduledJob);
});

app.get("/search", async (req, res) => {
    try {
        const data = req.query;
        const scores = await searchQuery(data.query as string);
        let promises = [];
        for (const key in scores) {
            promises.push(fetchWebsite(key));
        }
        let result = await Promise.all(promises);
        result.forEach(el => {
            el[0].cosine_score = scores[el[0].id];
            el[0].total_score = el[0].cosine_score + el[0].rank;
        })
        result.sort((a, b) => {
            return a[0].total_score < b[0].total_score ? 1 : -1;
        })
        res.send(result);
    } catch (e) {
        console.log("An error occurred");
    }
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})