import { QueryResult } from "pg";
import { pool } from "./connect";
import chalk from "chalk";

export type T_WEBSITE_SCHEMA = {
    title: string;
    description: string;
    url: string;
    word_count: number;
    rank: number; 
}

let websites = 0, keywords = 0, edges = 0, depth_stop = 0;

export async function isCrawled(url: string): Promise<boolean> {
    try {
        const queryText = 'SELECT * from websites where url = $1';
        const result = await pool.query(queryText, [url]);
        return result.rowCount != 0;
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error querying the database: ${e}`);
    }
    return false;
}

export async function AddWebsite(data: T_WEBSITE_SCHEMA) {
    try {
        const { title, description, url, word_count, rank } = data;
        const queryText = 'INSERT INTO websites (title, description, url, word_count, rank) VALUES ($1, $2, $3, $4, $5)';
        const values = [title, description, url, word_count, rank];
    
        const result = await pool.query(queryText, values);
        websites += 1;
        console.log(chalk.cyan(`[INFO]`) + `: Website added to database: ${result.rowCount}`);
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error adding to database: ${e}`);
    }
}

export async function AddKeyWords(_data: string[]) {
    try {
        let data = Array.from(new Set(_data));
        const values = data.map((word) => `('${word}', 1)`).join(', ');
        const queryText = 'INSERT INTO keywords (word, unique_count) values ' + values 
            + ' ON CONFLICT (word) DO UPDATE SET unique_count = keywords.unique_count + 1';
        
        const result = await pool.query(queryText);
        keywords += 1;
        console.log(chalk.cyan(`[INFO]`) + `: Keywords added to database: ${result.rowCount}`);
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error adding to database: ${e}`);
    }
}

export async function AddWebsiteKeywords(data: string[], url: string) {
    try {
        const map: Record<string, number> = {}
        data.forEach(word => {
            map[word] = (map[word] || 0) + 1;
        })
        
        const promises:Promise<QueryResult<any>>[] = [];
        for (const word in map) {
            const queryText = `
                with web_ids as (
                    select id from websites where url = $1
                ), word_ids as (
                    select id from keywords where word = $2
                )
                insert into website_keywords(keyword_id, website_id, count)
                SELECT ki.id AS keyword_id, wi.id AS website_id, $3 AS count
                FROM word_ids ki
                CROSS JOIN web_ids wi;
            `;
            const values = [url, word, map[word]];
            
            promises.push(pool.query(queryText, values));
        }

        Promise.all(promises);
        console.log(chalk.cyan(`[INFO]`) + `: References inserted to database`);
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error adding to database: ${e}`)
    }
}

export async function AddEdges(url1: string, url2: string) {
    try {
        const values = [url1, url2];
        const queryText = `
            with web_ids1 as (
                select id from websites where url = $1
            ), web_ids2 as (
                select id from websites where url = $2
            )
            insert into edges (url1, url2) 
            select ki.id as url1, wi.id as url2
            from web_ids1 ki cross join web_ids2 wi;
        `;
    
        const result = await pool.query(queryText, values);
        edges += 1;
        console.log(chalk.cyan(`[INFO]`) + `: Edges added to database: ${result.rowCount}`);
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error adding to database: ${e}`)
    }
}

export async function AddEdgesToCrawl(url1: string, url2: string) {
    try {
        const values = [url1, url2, false];
        const queryText = `
            insert into edges_to_crawl values ($1, $2, $3)
        `;
        const result = await pool.query(queryText, values);
        depth_stop += 1;
        console.log(chalk.cyan(`[INFO]`) + `: Website added to database: ${result.rowCount}`);
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error adding to database: ${e}`)
    }
}