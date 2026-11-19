[CmdletBinding()]
param(
    [string]$Repository = 'Zengggggg/cham-sac',
    [string]$BackendUrl = 'https://cham-sac-viet-api.onrender.com',
    [string]$FrontendUrl,
    [string]$VercelOrgId,
    [string]$VercelProjectId,
    [string]$RenderServiceId = 'srv-dbbek00n74is73dtvt40',
    [string]$AssetPath = '/ar-assets/models/thap-rua/Meshy_AI_turtle_tower_ar_optim_1015064523_texture.glb',
    [switch]$SkipSecrets
)

$ErrorActionPreference = 'Stop'
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Install GitHub CLI and run gh auth login first.' }
& gh auth status
if ($LASTEXITCODE -ne 0) { throw 'GitHub authentication is required. Run gh auth login, then retry.' }
if ($Repository -notmatch '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$') { throw 'Invalid repository name.' }

if (-not $FrontendUrl) { $FrontendUrl = Read-Host 'Production frontend origin (https://...), not a vercel.com dashboard link' }
if (-not $VercelOrgId) { $VercelOrgId = Read-Host 'Vercel Team/Organization ID from Settings' }
if (-not $VercelProjectId) { $VercelProjectId = Read-Host 'Vercel Project ID from Settings' }
foreach ($origin in @($BackendUrl, $FrontendUrl)) {
    $parsedOrigin = [Uri]$origin
    if ($parsedOrigin.Scheme -ne 'https' -or $parsedOrigin.AbsolutePath -ne '/' -or $parsedOrigin.UserInfo -or $parsedOrigin.Query -or $parsedOrigin.Fragment -or $parsedOrigin.Host -eq 'vercel.com') {
        throw 'Use the real HTTPS website origin without path, credentials, query or fragment.'
    }
}
if (-not $VercelOrgId.Trim() -or -not $VercelProjectId.Trim()) { throw 'Both Vercel IDs are required.' }

& gh api --method PUT "repos/$Repository/environments/production" `
    -F 'deployment_branch_policy[protected_branches]=false' `
    -F 'deployment_branch_policy[custom_branch_policies]=true' --silent
if ($LASTEXITCODE -ne 0) { throw 'Could not configure GitHub production environment.' }
$policyResponse = & gh api "repos/$Repository/environments/production/deployment-branch-policies"
if ($LASTEXITCODE -ne 0) { throw 'Could not read deployment branch policies.' }
$mainPolicy = ($policyResponse | ConvertFrom-Json).branch_policies | Where-Object { $_.name -eq 'main' -and $_.type -eq 'branch' }
if (-not $mainPolicy) {
    & gh api --method POST "repos/$Repository/environments/production/deployment-branch-policies" -f 'name=main' -f 'type=branch' --silent
    if ($LASTEXITCODE -ne 0) { throw 'Could not restrict deployment to main.' }
}

$publicVariables = [ordered]@{
    RENDER_SERVICE_ID = $RenderServiceId
    VERCEL_ORG_ID = $VercelOrgId.Trim()
    VERCEL_PROJECT_ID = $VercelProjectId.Trim()
    PRODUCTION_BACKEND_URL = $BackendUrl.TrimEnd('/')
    PRODUCTION_FRONTEND_URL = $FrontendUrl.TrimEnd('/')
    AR_SMOKE_ASSET_PATH = $AssetPath
}
foreach ($item in $publicVariables.GetEnumerator()) {
    & gh variable set $item.Key --repo $Repository --env production --body $item.Value
    if ($LASTEXITCODE -ne 0) { throw "Could not set $($item.Key)." }
}

if (-not $SkipSecrets) {
    foreach ($secretName in @('RENDER_API_KEY', 'VERCEL_TOKEN')) {
        Write-Host "Enter $secretName at the GitHub CLI secret prompt. Do not paste it into chat."
        & gh secret set $secretName --repo $Repository --env production
        if ($LASTEXITCODE -ne 0) { throw "Could not save $secretName." }
    }
}
Write-Host "GitHub production configuration saved. Follow docs/cicd/README.md to configure Render/Vercel before merging main."
