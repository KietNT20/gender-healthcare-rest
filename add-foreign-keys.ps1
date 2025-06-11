# Script to add back foreign key columns that are needed for relations

$entityFiles = Get-ChildItem -Path "src\modules\**\entities\*.entity.ts" -Recurse

foreach ($file in $entityFiles) {
    Write-Host "Adding foreign keys: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Find ManyToOne relations and add corresponding foreign key columns
    # This regex finds @ManyToOne patterns and extracts the property name
    $manyToOneMatches = [regex]::Matches($content, '@ManyToOne\([^}]+\}\)\s*@JoinColumn\(\)\s*(\w+):\s*(\w+);')
    
    $foreignKeysToAdd = @()
    
    foreach ($match in $manyToOneMatches) {
        $propertyName = $match.Groups[1].Value
        $typeName = $match.Groups[2].Value
        
        # Create foreign key property name (e.g., user -> userId, consultantProfile -> consultantProfileId)
        $fkName = $propertyName + "Id"
        
        # Check if foreign key already exists
        if ($content -notmatch "@Column\(\)\s*$fkName:\s*string;") {
            $foreignKeysToAdd += "  @Column()`n  $fkName`: string;`n"
        }
    }
    
    if ($foreignKeysToAdd.Count -gt 0) {
        # Find the position to insert foreign keys (before // Relations comment or before first @ManyToOne)
        $insertPosition = $content.IndexOf("// Relations")
        if ($insertPosition -eq -1) {
            $insertPosition = $content.IndexOf("@ManyToOne")
        }
        
        if ($insertPosition -gt -1) {
            $beforeRelations = $content.Substring(0, $insertPosition)
            $afterRelations = $content.Substring($insertPosition)
            
            $foreignKeysSection = "`n  // Foreign Keys`n" + ($foreignKeysToAdd -join "`n") + "`n"
            $content = $beforeRelations + $foreignKeysSection + $afterRelations
        }
    }
    
    Set-Content $file.FullName -Value $content
}

Write-Host "Foreign keys added!"
