import { QueryResult } from "pg";
import { pool } from "./connect";
import chalk from "chalk";
import { T_EDGES, T_NODES } from "../pagerank/pr";

export async function fetchNodes() {
    try {
        const queryText = 'SELECT id, rank from websites';
        const result = await pool.query(queryText);
        let rows = result.rows;
        rows = rows.map((r, i) => ({id: r.id, rank: r.rank, index: i}));
        return rows as T_NODES[];
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error fetching websites from the database: ${e}`);
    }
    return null;
}

export async function fetchEdges() {
    try {
        const queryText = 'SELECT * from edges';
        const result = await pool.query(queryText);
        let rows = result.rows;
        return rows as T_EDGES[];
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error fetching websites from the database: ${e}`);
    }
    return null;
}

export async function storePageRanks(ranks: T_NODES[]) {
    try {
        for (const node of ranks) {
            const queryText = 'UPDATE websites SET rank = $1 WHERE id = $2';
            const values = [node.rank, node.id];
            let result = await pool.query(queryText, values);
        }
        console.log(chalk.cyan(`[INFO]`) + `: Pageranks updated in the database`);
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Error trying to store pageranks in the database: ${e}`);
    }
}