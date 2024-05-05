import puppeteer, { Browser, Page } from "puppeteer";
import loader, { T_SITE } from "../helpers/loader";
import lemmatize from "../helpers/lemmatize";
import { AddEdges, AddEdgesToCrawl, AddKeyWords, AddWebsite, AddWebsiteKeywords, isCrawled } from "../database/query";
import chalk from "chalk"
import fetchDomain from "../helpers/fetchDomain";
import * as robotGuard from "@flyyer/robotstxt";
import isAllowed from "../helpers/robotsParser";
import validUrl from "valid-url";

const globalSetUris = new Set();

export async function crawler() {
    const sites:T_SITE[] = await loader("top-1000.txt");
    for (let {url, rank} of sites) {
        await crawlSite(url, 1, 3);
    }
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}  

async function crawlSite(url: string, rank: number, depth: number, parentUrl?: string): Promise<boolean> {
    if (await isCrawled(url)) {
        if (parentUrl) {
            await AddEdges(parentUrl, url);
        }
        console.log(chalk.yellow(`[WARNING]`) + ": URL already visited");
        return false;
    }
    
    // console.log(chalk.cyan(`[INFO]`) + ": Rate limiting");
    await delay(Math.floor(Math.random() * (10 - 3 + 1)) + 3);
    // console.log(chalk.cyan(`[INFO]`) + ": Rate limiting over");

    if (depth <= 0) {
        parentUrl ? await AddEdgesToCrawl(parentUrl, url) : "";
        console.log(chalk.cyan(`[INFO]`) + ": Depth limit reached");
        return false;
    }

    
    let browser: Browser;
    let page: Page;

    // 1. create a browser
    try {
        browser = await puppeteer.launch();
    } catch (e) {
        console.log(chalk.red(`[ERROR]`) + `: Failed to create browser for: ${url}`);
        return false;
    }

    // 2. new page and check the request
    page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on("request", (req) => {
        if (req.isInterceptResolutionHandled()) return;

        switch (req.resourceType()) {
            case "image":
            case "media":
            case "stylesheet":
            case "font":
            case "script":
                req.abort();
                break;
            default:
                req.continue();
        }
    })

    // 3. check if permitted
    if (!validUrl.isUri(url)) {
        console.log(chalk.yellow(`[YELLOW]`) + `: Invalid URL given ${url}`);
        return false;
    }
    const domain = fetchDomain(url);
    const robotsUrl = "https://" + domain + "/robots.txt";
    let forbidden = false;
    let robotsContents: string = "";
    try {
        await page.goto(robotsUrl);
        robotsContents = (await page.content())
                    .replace(/<[^>]*>/g, "")
                    .replace(/<[^>]*\/>/g, "")
        const robots = robotGuard.PARSE(robotsContents);
        const guard = robotGuard.GUARD(robots.groups);
        forbidden = isAllowed(guard, url, "*");
    } catch (e) {
        forbidden = true;
    }

    if (forbidden) {
        // console.log(chalk.yellow(`[WARNING]`) + `: Do not have permission to crawl ${url}`);
        // return false;
    }

    // 4. Start crawling
    console.log(chalk.cyan(`[INFO]`) + `: Crawling: ${url}`);

    try {
        await page.goto(url);
    } catch (e) {
        console.log(chalk.yellow(`[WARNING]`) + `: Request failed (likely not permitted)`)
        return false;
    }

    // 5. Restricting to only specific languages
    const language = await page.evaluate(() => {
        const html = document.querySelector("html");
        return html?.getAttribute("lang");
    })

    if (!language) return false;
    if (!language.startsWith("en")) return false;


    // 6. Title and Description of site
    const [pageTitle, pageDescription] = await page.evaluate(() => {
        const metaTags = document.getElementsByTagName("meta");
        let description = "";

        for (let i=0; i<metaTags.length; i++) {
            if (metaTags[i].getAttribute("name") === "description") {
                description = metaTags[i].getAttribute("content") as string;
            }
        }

        return [document.title ? document.title : "", description];
    });

    // 7. Picking all the words from the site visible
    let words: string[] = await page.evaluate(() => {
        const text = (document.querySelector("*") as any).innerText;
        return text.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`'~()]/g, "")
            .split(/[\n\r\s]+/g);
    })

    // 8. Lemmatizing all the words
    let lemmWords = [];
    let batchSize = 1000;
    for (let i=0; i<words.length; i+=batchSize) {
        const batchWords = words.slice(i, i+batchSize);
        const promises = batchWords.map(word => lemmatize(word));
        const ans = await Promise.all(promises);
        lemmWords.push(...ans);
    }
    
    if (words.length == 0) {
        console.log(chalk.yellow(`[WARNING]`) + `: No words found for: ${url}`);
        return false;
    }

    // 9. Storing in the database
    await AddWebsite({
        title: pageTitle, 
        description: pageDescription,
        url: url,
        word_count: lemmWords.length,
        rank: rank,
    })
    globalSetUris.add(url);

    await AddKeyWords(lemmWords);

    await AddWebsiteKeywords(lemmWords, url);

    if (parentUrl) {
        await AddEdges(parentUrl, url);
    }
    
    // 10. Finding links on the page and crawling those links
    let links = await page.$$eval('a', as => as.map(a => a.href.replace(/\/$/, '')));
    links = links.filter(li => li != url && validUrl.isUri(li));
    links = links.map(ll => ll.split(/[?#]/)[0]);
    links = [...new Set(links)];
    for (const link of links) {
        console.log(chalk.cyan(`[INFO]`) + `: JUMPING to ${link}`)
        let _ = await crawlSite(link, rank, depth-1, url);
    }

    await page.close();

    console.log(chalk.green(`[SUCCESS]`) + `: Crawled successfully: ${url}`);
    return true;
}