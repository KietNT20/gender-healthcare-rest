# Script to fix all entity files according to requirements:
# 1. Remove 'name' options from all decorators
# 2. Remove all @Index decorators with names, replace with @Index()

$entityFiles = Get-ChildItem -Path "src\modules\**\entities\*.entity.ts" -Recurse

foreach ($file in $entityFiles) {
    Write-Host "Processing: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Remove name options from @Entity
    $content = $content -replace "@Entity\('.*?'\)", "@Entity()"
    
    # Remove name options from @Column
    $content = $content -replace "name:\s*'[^']*',?\s*", ""
    
    # Remove name options from @CreateDateColumn
    $content = $content -replace "@CreateDateColumn\(\{\s*name:\s*'[^']*'\s*\}\)", "@CreateDateColumn()"
    
    # Remove name options from @UpdateDateColumn  
    $content = $content -replace "@UpdateDateColumn\(\{\s*name:\s*'[^']*'\s*\}\)", "@UpdateDateColumn()"
    
    # Remove name options from @DeleteDateColumn but keep other options
    $content = $content -replace "@DeleteDateColumn\(\{\s*name:\s*'[^']*',?\s*", "@DeleteDateColumn({ "
    $content = $content -replace "@DeleteDateColumn\(\{\s*name:\s*'[^']*'\s*\}\)", "@DeleteDateColumn()"
    
    # Remove name options from @JoinColumn
    $content = $content -replace "@JoinColumn\(\{\s*name:\s*'[^']*'\s*\}\)", "@JoinColumn()"
    
    # Replace @Index with specific names to @Index()
    $content = $content -replace "@Index\('.*?'\)", "@Index()"
    
    # Clean up any extra commas and spaces
    $content = $content -replace ",\s*\}", " }"
    $content = $content -replace "\{\s*,", "{"
    $content = $content -replace ",\s*,", ","
    
    Set-Content $file.FullName -Value $content
}

Write-Host "All entity files have been processed!"
