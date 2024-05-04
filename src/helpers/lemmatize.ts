import fs from "fs/promises";
import { lemmatizer } from "lemmatizer";

let lemmatizedMap: Record<string, string> | undefined;
let rootWords: Set<string> = new Set();

async function loadLemmatizedMap() {
    if (!lemmatizedMap) {
        const text = await fs.readFile("./lemmatized.json", "utf-8");
        lemmatizedMap = JSON.parse(text);
        for (const word in lemmatizedMap) {
            rootWords.add(lemmatizedMap[word]);
        }
    }
    return lemmatizedMap;
}

export default async function lemmatize(word: string): Promise<string> {
    if (!lemmatizedMap) await loadLemmatizedMap();
    if (rootWords.has(word)) return word;
    else if ((lemmatizedMap as any)[word]) {
        return (lemmatizedMap as any)[word];
    }
    return lemmatizer(word);
}
