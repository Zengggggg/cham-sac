import { appendFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { commitSha, required, runCli } from './config.mjs';

const failedStatuses = new Set(['build_failed', 'pre_deploy_failed', 'update_failed', 'canceled', 'deactivated']);

export async function deployRender({ serviceId, apiKey, sha, fetchImpl = fetch, sleep = delay, attempts = 120, intervalMs = 10000, log = console.log }) {
    commitSha(sha);
    if (!/^srv-[a-z0-9]+$/.test(serviceId) || !apiKey) throw new Error('Invalid Render deployment configuration');
    const base = `https://api.render.com/v1/services/${serviceId}`;
    const request = async (url, options = {}) => {
        const response = await fetchImpl(url, {
            ...options,
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(30000)
        });
        if (!response.ok) throw new Error(`Render API returned HTTP ${response.status}; check credentials, permissions and service ID`);
        return response.json();
    };
    const service = await request(base);
    if (service.autoDeployTrigger !== 'off') throw new Error('Set Render Auto-Deploy to Off before enabling this pipeline');
    // A POST is intentionally not retried: an ambiguous network failure could create two deployments.
    const deployment = await request(`${base}/deploys`, { method: 'POST', body: JSON.stringify({ commitId: sha }) });
    if (!/^dep-[a-z0-9]+$/.test(deployment.id)) throw new Error('Render did not return a valid deployment ID');
    log(`Waiting for Render deployment ${deployment.id}`);
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const current = await request(`${base}/deploys/${deployment.id}`);
        if (current.status === 'live') {
            if (current.commit?.id !== sha) throw new Error('Render deployed a different commit; frontend deployment stopped');
            return deployment.id;
        }
        if (failedStatuses.has(current.status)) throw new Error(`Render deployment ${deployment.id} ended with ${current.status}`);
        if (attempt + 1 < attempts) await sleep(intervalMs);
    }
    throw new Error(`Timed out waiting for Render deployment ${deployment.id}; inspect its dashboard before retrying`);
}

runCli(import.meta.url, async () => {
    const deployId = await deployRender({
        serviceId: required(process.env, 'RENDER_SERVICE_ID'),
        apiKey: required(process.env, 'RENDER_API_KEY'),
        sha: commitSha(required(process.env, 'EXPECTED_COMMIT_SHA'))
    });
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `deploy_id=${deployId}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `Render backend is live: \`${deployId}\`.\n`);
    console.log(`Render deployment verified: ${deployId}`);
});
