# fwg 
# https://github.com/waymondrang/fwg

param (
    [Parameter(Mandatory)][String]$Target,
    [Parameter()][switch]$r,
    [Parameter(ValueFromRemainingArguments)][String[]]$Pattern
)

# https://stackoverflow.com/a/41397864
function Write-Error($message) {
    [Console]::Error.WriteLine($message)
    [Console]::ResetColor()
}

# https://serverfault.com/a/95464
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())

if (-Not ($currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))) {
    Write-Error "Insufficient privileges. Please run as administrator."
    exit 1
}

if ($null -eq $Target) {
    Write-Error "No target provided."
    exit 1
}

if (-Not (Test-Path -Path $Target)) {
    Write-Error "Target is not valid path."
    exit 1
}

Remove-Item function:Write-Error

if ($null -eq $Pattern) {
    $Pattern = , "*.exe"
}

if ($r.IsPresent) {
    Write-Output "Removing firewall rules for $($Pattern -join ", ") in $Target"
}
else {
    Write-Output "Searching for $($Pattern -join ", ") in $Target"
}

$files = Get-ChildItem $Target -Include $Pattern -Recurse

$Counter = 0

Write-Output "Found $($files.Count) target files"

if ($r.IsPresent) {
    foreach ($f in $files) {
        # Get-NetFirewallApplicationFilter -Program "$($f.FullName)" 2> $null | Out-Null # Optimized script to run 80% faster
        netsh advfirewall firewall show rule name="$($f.FullName) AutoBlock" 2> $null | Out-Null # More reliable & similar speed. Uses name instead of path
        if ( $? ) {
            netsh advfirewall firewall delete rule name="$($f.FullName) AutoBlock" dir=out program="$($f.FullName)" | Out-Null
            Write-Output "Removed firewall rule for $($f.FullName)"
            $Counter++
        }
        else {
            Write-Output "Skipped $($f.FullName), no firewall rule found"
        }
    }
}
else {
    foreach ($f in $files) {
        Get-NetFirewallApplicationFilter -Program "$($f.FullName)" 2> $null | Out-Null # Optimized script to run 80% faster
        if ( $? ) {
            Write-Output "Skipped $($f.FullName), firewall already configured"
        }
        else {
            netsh advfirewall firewall add rule name="$($f.FullName) AutoBlock" dir=out program="$($f.FullName)" action=block | Out-Null
            Write-Output "Added New Firewall Rule for $($f.FullName)"
            $Counter++
        }
    }
}

if ($r.IsPresent) {
    Write-Output "Removed $($Counter) firewall rules targeting $($files.Count) files in $($Target)"
}
else {
    Write-Output "Created $($Counter) new rules targeting $($files.Count) files in $($Target)"
}