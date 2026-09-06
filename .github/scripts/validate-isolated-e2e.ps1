[CmdletBinding(DefaultParameterSetName = 'Files')]
param(
    [Parameter(Mandatory, ParameterSetName = 'Files')]
    [string] $PlaywrightConfigPath,

    [Parameter(Mandatory, ParameterSetName = 'Files')]
    [string] $TestProfilePath,

    [Parameter(Mandatory, ParameterSetName = 'Content')]
    [AllowEmptyString()]
    [string] $PlaywrightConfigContent,

    [Parameter(Mandatory, ParameterSetName = 'Content')]
    [AllowEmptyString()]
    [string] $TestProfileContent
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($PSCmdlet.ParameterSetName -eq 'Files') {
    $PlaywrightConfigContent = Get-Content -Raw -LiteralPath $PlaywrightConfigPath
    $TestProfileContent = Get-Content -Raw -LiteralPath $TestProfilePath
}

$requiredPlaywrightSettings = @(
    "SPRING_PROFILES_ACTIVE: 'test'",
    'reuseExistingServer: false'
)
foreach ($setting in $requiredPlaywrightSettings) {
    if (-not $PlaywrightConfigContent.Contains($setting)) {
        throw "Unsafe E2E configuration: missing $setting"
    }
}

$expectedProviderUrls = [ordered]@{
    INTEGRATIONS_BRAPI_URL = 'http://127.0.0.1:9090/brapi/api'
    INTEGRATIONS_TWELVEDATA_URL = 'http://127.0.0.1:9090/twelvedata'
    INTEGRATIONS_BRASILAPI_URL = 'http://127.0.0.1:9090/brasilapi/cnpj/v1'
    INTEGRATIONS_VIACEP_URL = 'http://127.0.0.1:9090/viacep'
}

foreach ($entry in $expectedProviderUrls.GetEnumerator()) {
    $escapedName = [regex]::Escape($entry.Key)
    $assignmentPattern = "(?m)^\s*$escapedName\s*:\s*'([^']+)'\s*,?\s*$"
    $assignments = [regex]::Matches($PlaywrightConfigContent, $assignmentPattern)

    if ($assignments.Count -ne 1) {
        throw "Unsafe E2E configuration: $($entry.Key) must be assigned exactly once."
    }

    $actualUrl = $assignments[0].Groups[1].Value
    if ($actualUrl -cne $entry.Value) {
        throw "Unsafe E2E configuration: $($entry.Key) must be exactly '$($entry.Value)'."
    }
}

if (-not $TestProfileContent.Contains('jdbc:h2:mem:gestaoacoes')) {
    throw 'Unsafe E2E configuration: Spring test profile is not using the expected in-memory H2 database.'
}

Write-Output 'Isolated E2E configuration is valid.'
