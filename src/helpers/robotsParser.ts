export default function isAllowed(guard: any, path: string, userAgent?: string): boolean {
    const rule = guard.isAllowedBy(path, userAgent);
    if (rule) {
        return rule.allow;
    }
    return true;
}