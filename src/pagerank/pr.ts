import { fetchEdges, fetchNodes, storePageRanks } from "../database/pagerank";
import chalk from "chalk";
import { is_similar, matrix_const_mult, matrix_matrix_add, matrix_vector_mult, normalize } from "../helpers/matrix";

export type T_NODES = {
    id: string;
    index: number;
    rank: number;
};

export type T_EDGES = {
    url1: string;
    index1: number;
    url2: string;
    index2: number;
}

class Graph {
    adjMatrix:number[][] = [];
    nodes:T_NODES[] = [];
    edges:T_EDGES[] = [];

    constructor() {
        this.adjMatrix = [];
    }

    async prepareAdjMatrix(nodes:T_NODES[], edges:T_EDGES[]) {
        this.nodes = nodes;
        this.edges = edges;
        let num = nodes.length;

        edges.forEach(ed => {
            const nd1 = nodes.find(nd => nd.id === ed.url1);
            const nd2 = nodes.find(nd => nd.id === ed.url2);

            if (!nd1 || !nd2) {
                console.log(chalk.red(`[ERROR]`) + `: Website not found for edges`);
                throw Error;
            }
            ed.index1 = nd1.index;
            ed.index2 = nd2.index;
        })
        
        for (let i=0; i<num; i++) {
            this.adjMatrix.push(Array.from({length: num}, ()=>0));
        }

        edges.forEach(ed => {
            this.adjMatrix[ed.index1][ed.index2] = 1;
        });

        // this.adjMatrix = [[0, 1, 1, 0],[0, 0, 1, 0],[1, 0, 0, 0], [0, 0, 1, 0]]
    }

    drawGraph() {
        console.log(this.adjMatrix);
    }

    pageRank(initialPR: number[] | undefined) {
        // Adjacency Matrix / by degree of node
        let M = this.adjMatrix;
        for (let i=0; i<M.length; i++) {
            let count = 0;
            for (let j=0; j<M.length; j++) {
                count += M[i][j];
            }

            if (count == 0) {
                for (let j=0; j<M.length; j++) {
                    M[i][j] = 1/M.length;
                }
            } else {
                for (let j=0; j<M.length; j++) {
                    M[i][j] /= count;
                }
            }
        }

        // Transpose of matrix
        for (let i=0; i<M.length; i++) {
            for (let j=i; j<M.length; j++) {
                let tmp = M[i][j]
                M[i][j] = M[j][i];
                M[j][i] = tmp;
            }
        }
        
        // damping factor
        let d = 0.85;
        // damping factor matrix
        let J = Array.from({length: this.adjMatrix.length}, () => 1-d/M.length);
        // initial page rank
        let P = Array.from({length: this.adjMatrix.length}, ()=>1 / M.length);
        if (initialPR) P = initialPR;
               
        let iteration = 0;
        while (iteration <= 1e6) {
            let P_dash = matrix_matrix_add(matrix_const_mult(matrix_vector_mult(M, P), d), J);
            // console.log(normalize(P_dash));
            if (is_similar(P, P_dash, 0.0001)) {
                console.log(chalk.cyan(`[INFO]`) + `: Ranks have converged`);
                break;
            }
            iteration += 1;
            P = normalize(P_dash);
        }
        
        return P;
    }
    
}

export default async function applyPagerank() {
    let g = new Graph();
    let nodes = await fetchNodes();
    let edges = await fetchEdges();

    if (!nodes || !edges) {
        console.log(chalk.red(`[ERROR]`) + `: Some error occurred`);
        return;
    }

    let initialP:number[] = nodes.map(nd => nd.rank);

    g.prepareAdjMatrix(nodes, edges);

    let ranks = g.pageRank(initialP);

    let pageRanks = nodes.map((nd, i) => {nd.rank = ranks[i]; return nd;});
    console.log(pageRanks);
    await storePageRanks(pageRanks);
}