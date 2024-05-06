import chalk from "chalk";
import { fetchIDFScore, fetchTFScore } from "../database/tfidf";
import lemmatize from "../helpers/lemmatize";

export default async function searchQuery(query: string) {
    let cosine_score:Record<string, number> = await search(query);
    return cosine_score;
}

async function search(query: string) {
    // 1. lemmatizing words
    let wordLists = query.split(" ");
    let promises = wordLists.map((wrd) => lemmatize(wrd));
    wordLists = await Promise.all(promises);

    // 2. Converting to lowercase
    wordLists = wordLists.map(wrd => wrd.toLowerCase());
    
    // 3. TF score for query vector
    let query_tf: Record<string, number> = {};
    wordLists.forEach(wrd => {
        if (query_tf[wrd]) query_tf[wrd] += 1;
        else query_tf[wrd] = 1;
    });

    // 4. Normalized TF score for query vector
    for (const key in query_tf) { query_tf[key] /= wordLists.length; }
    
    // 5. Only considering unique words
    wordLists = [...new Set(wordLists)];
    
    let idfs:Record<string, number> = {};
    let doc_vectors:Record<string, Record<string, number>> = {};
    
    // 6. Traversing all the words
    for (let word of wordLists) {
        // 7. fetching tf and idf scores
        const tfscore = await fetchTFScore(word);
        const idfscore = await fetchIDFScore(word);

        
        if (!tfscore || !idfscore) {
            console.log(chalk.red(`[ERROR]`) + `: An unexpected occurred`);
            throw new Error;
        }
        
        if (tfscore.length == 0 || idfscore.length == 0) continue;

        // 8. Calculating tf-idf product
        tfscore.forEach(el => {
            el.tf_idf_product = el.normalized_term_frequency * idfscore[0].idf_score;
            
            // 9. Creating document vector
            if (!doc_vectors[el.w_id]) {
                doc_vectors[el.w_id] = {}
            }
            doc_vectors[el.w_id][el.word] = el.tf_idf_product;
        });
        
        // 10. Storing idf score of each word to prepare query vector
        idfs[word] = idfscore[0].idf_score as number;
    }
    
    // 11. Query idf score
    for (const key in query_tf) {
        query_tf[key] *= idfs[key];
    }
    
    // 12. now to find cosine similarity
    let cosine_score: Record<string, number> = {};
    for (const key in doc_vectors) {
        const vec1 = query_tf;
        const vec2 = doc_vectors[key];

        let dot_product = 0;
        let mod_1 = 0, mod_2 = 0;
        for (const wrd in vec1) {
            mod_1 += vec1[wrd] * vec1[wrd];
            if (vec2[wrd]) {
                dot_product += vec1[wrd] * vec2[wrd];
                mod_2 += vec2[wrd] * vec2[wrd];
            }
        }

        cosine_score[key] = dot_product / (Math.sqrt(mod_1) * Math.sqrt(mod_2));
    }
    
    return cosine_score;
}