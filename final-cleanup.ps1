# Final cleanup script to fix remaining import and formatting issues

$entityFiles = Get-ChildItem -Path "src\modules\**\entities\*.entity.ts" -Recurse

foreach ($file in $entityFiles) {
    Write-Host "Final cleanup: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Fix broken import statements
    $content = $content -replace "UpdateDateColumn\s+from 'typeorm';", "UpdateDateColumn,`n} from 'typeorm';"
    $content = $content -replace "CreateDateColumn\s+from 'typeorm';", "CreateDateColumn,`n} from 'typeorm';"
    $content = $content -replace "DeleteDateColumn\s+from 'typeorm';", "DeleteDateColumn,`n} from 'typeorm';"
    $content = $content -replace "PrimaryGeneratedColumn\s+from 'typeorm';", "PrimaryGeneratedColumn,`n} from 'typeorm';"
    $content = $content -replace "JoinColumn\s+from 'typeorm';", "JoinColumn,`n} from 'typeorm';"
    
    # Add proper spacing between properties
    $lines = $content -split "`n"
    $newLines = @()
    
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        $newLines += $line
        
        # Add blank line after property declarations (not decorators)
        if ($line -match '^\s*\w+[?:]?\s*\w+.*[;}]\s*$' -and $i -lt $lines.Length - 1) {
            $nextLine = $lines[$i + 1]
            if ($nextLine -match '^\s*@(Column|Index|CreateDateColumn|UpdateDateColumn|DeleteDateColumn|ManyToOne|OneToMany|OneToOne)') {
                $newLines += ""
            }
        }
    }
    
    $content = $newLines -join "`n"
    
    Set-Content $file.FullName -Value $content
}

Write-Host "Final cleanup completed!"
