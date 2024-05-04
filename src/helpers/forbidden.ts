
export default function isRootForbidden(robots: string): boolean {
    const lines = robots.split("\n");
    
    let isForbidden = false;
    let userAgentAll = false;

    for (let i=0; i<lines.length; i++) {
        const line = lines[i].trim().toLowerCase();
        if (line.length == 0) continue;
        if (line.startsWith("#")) continue;

        let [key, value] = line.trim().replace(/\s+/g, " ").split(":");

        if (!key || !value) continue;

        key = key.trim();
        value = value.trim();

        if (key === "user-agent" && value == "*") {
            userAgentAll = true;
            continue;
        }

        if (!userAgentAll) continue;
        if (key == "disallow" && value == "/") {
            isForbidden = true;
            break;
        }
    }

    return isForbidden;
}