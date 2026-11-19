import { access, writeFile } from 'node:fs/promises';
import { commitSha, required, runCli } from './config.mjs';

runCli(import.meta.url, async () => {
    const sha = commitSha(required(process.env, 'EXPECTED_COMMIT_SHA'));
    await access('.vercel/output/static/index.html');
    await writeFile('.vercel/output/static/release.json', `${JSON.stringify({ commitSha: sha })}\n`);
    console.log('Stamped Vercel artifact with the release commit.');
});
