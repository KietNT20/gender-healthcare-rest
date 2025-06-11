# Enhanced script to clean up formatting issues after the first pass

$entityFiles = Get-ChildItem -Path "src\modules\**\entities\*.entity.ts" -Recurse

foreach ($file in $entityFiles) {
    Write-Host "Cleaning up: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Fix imports that got broken
    $content = $content -replace "UpdateDateColumn\s*\}", "UpdateDateColumn"
    $content = $content -replace "CreateDateColumn\s*\}", "CreateDateColumn"
    $content = $content -replace "DeleteDateColumn\s*\}", "DeleteDateColumn"
    
    # Fix broken object closing braces after removing properties
    $content = $content -replace "onDelete:\s*'CASCADE'\s*\}", "onDelete: 'CASCADE',`n  }"
    
    # Fix any remaining formatting issues with empty objects
    $content = $content -replace "@Column\(\{\s*\}\)", "@Column()"
    $content = $content -replace "@CreateDateColumn\(\{\s*\}\)", "@CreateDateColumn()"
    $content = $content -replace "@UpdateDateColumn\(\{\s*\}\)", "@UpdateDateColumn()"
    $content = $content -replace "@DeleteDateColumn\(\{\s*\}\)", "@DeleteDateColumn()"
    $content = $content -replace "@JoinColumn\(\{\s*\}\)", "@JoinColumn()"
    
    # Fix spacing issues
    $content = $content -replace "`n\s*@Column", "`n  @Column"
    $content = $content -replace "`n\s*@Index", "`n  @Index"
    $content = $content -replace "`n\s*@CreateDateColumn", "`n  @CreateDateColumn"
    $content = $content -replace "`n\s*@UpdateDateColumn", "`n  @UpdateDateColumn"
    $content = $content -replace "`n\s*@DeleteDateColumn", "`n  @DeleteDateColumn"
    $content = $content -replace "`n\s*@ManyToOne", "`n  @ManyToOne"
    $content = $content -replace "`n\s*@OneToMany", "`n  @OneToMany"
    $content = $content -replace "`n\s*@OneToOne", "`n  @OneToOne"
    $content = $content -replace "`n\s*@JoinColumn", "`n  @JoinColumn"
    
    Set-Content $file.FullName -Value $content
}

Write-Host "Cleanup completed!"
