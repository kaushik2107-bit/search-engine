import express from "express";
import searchQuery from "./searcher/search";
import { fetchWebsite } from "./database/tfidf";

const app = express();
const port = 3000;

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