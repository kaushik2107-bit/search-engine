import { pool } from "./connect";
import chalk from "chalk";

export type T_TFSCORE = {
    w_id: string;
    pr: number;
    k_id: string;
    total_website_words: number;
    word: string;
    word_appearances_doc: number;
    word_count_in_website: number;
    normalized_term_frequency: number;
    tf_idf_product: number | undefined;
}

export type T_IDFSCORE = {
    k_id: string;
    word: string;
    idf_score: number;
}

export async function fetchTFScore(word: string) {
    try {
        const queryText = `
            select 
                w.id as w_id, w.rank as pr, k.id as k_id, 
                w.word_count as total_website_words, 
                k.word, 
                k.unique_count as word_appearances_doc, 
                wk.count as word_count_in_website,
                cast(wk.count as float) / w.word_count as normalized_term_frequency
            from keywords as k 
            join website_keywords as wk on k.id = wk.keyword_id
            join websites w ON wk.website_id = w.id
            where k.word = LOWER($1)
        `;
        const result = await pool.query(queryText, [word]);
        return result.rows as T_TFSCORE[];
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error fetching tf scores from the database: ${e}`);
    }
    return null;
}

export async function fetchIDFScore(word:string) {
    try {
        const queryText = `
            select
                keywords.id as k_id,
                keywords.word as word,
                1 + LN(CAST((SELECT COUNT(DISTINCT id) FROM websites) AS NUMERIC) / keywords.unique_count) AS idf_score
            FROM keywords
            WHERE keywords.word = LOWER($1);
        `;
        const result = await pool.query(queryText, [word]);
        return result.rows as T_IDFSCORE[]
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error fetching idf scores from the database: ${e}`);
    }
    return null;
}

export async function fetchWebsite(id: string) {
    try {
        const queryText = `
            select * from websites where id = $1
        `;
        const result = await pool.query(queryText, [id]);
        return result.rows;
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error fetching website details: ${e}`);
        throw Error;
    }
}