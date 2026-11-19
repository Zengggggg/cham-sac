import { pathToFileURL } from 'node:url';

export function required(env, name) {
    const value = env[name]?.trim();
    if (!value) throw new Error(`Missing configuration: ${name}`);
    return value;
}

export function httpsOrigin(value, name) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
        throw new Error(`${name} must be an HTTPS origin without a path, credentials, query or fragment`);
    }
    return url.origin;
}

export function commitSha(value) {
    if (!/^[a-f0-9]{40}$/.test(value)) throw new Error('Expected a full 40-character Git commit SHA');
    return value;
}

export function runCli(moduleUrl, action) {
    if (process.argv[1] && moduleUrl === pathToFileURL(process.argv[1]).href) {
        action().catch((error) => {
            console.error(error.message);
            process.exitCode = 1;
        });
    }
}
