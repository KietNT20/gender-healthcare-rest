# Script to remove all remaining @Index decorators with names or arrays

$entityFiles = Get-ChildItem -Path "src\modules\**\entities\*.entity.ts" -Recurse

foreach ($file in $entityFiles) {
    Write-Host "Removing remaining indexes: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Remove @Index decorators at class level (before export class)
    $content = $content -replace "\s*@Index\([^)]*\)\s*export class", "`nexport class"
    
    # Remove standalone @Index lines with arrays or complex parameters
    $content = $content -replace "\s*@Index\([^)]*\[.*?\][^)]*\)\s*", ""
    $content = $content -replace "\s*@Index\('[^']*',\s*\[.*?\]\)\s*", ""
    $content = $content -replace "\s*@Index\('[^']*',\s*\[.*?\],\s*\{.*?\}\)\s*", ""
    
    # Clean up any remaining named indexes
    $content = $content -replace "\s*@Index\('[^']*'\)\s*", ""
    
    Set-Content $file.FullName -Value $content
}

Write-Host "All remaining indexes removed!"
