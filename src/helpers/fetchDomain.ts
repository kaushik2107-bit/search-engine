export default function fetchDomain(url: string): string {
    try {
        let link = new URL(url);
        return link.host
    } catch (e) {
        console.log(url);
        throw e;
    }
}