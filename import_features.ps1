
$ghParams = @{
    "2.0 — Cohesive UI and Flow" = @(
        @{ Title = "Reorganize parameters into 4 to 5 groups"; Body = "**Summary**: Create clear sections so the UI feels cohesive.`n`n**Details**: Define 4 to 5 sections only, Move sliders into correct groups (e.g., Source, Geometry, Animation, Color and Brightness, Output and View).`n`n**Acceptance Criteria**: All sliders are grouped under a minimal number of clear headers."; Label = "High" },
        @{ Title = "Add 'Advanced' toggle to hide secondary controls"; Body = "**Summary**: Reduce visual clutter and complexity on the default screen.`n`n**Details**: Add toggle labeled 'Advanced', When off, hide secondary parameters, Core sliders always visible.`n`n**Acceptance Criteria**: Default view shows only essential controls."; Label = "High" },
        @{ Title = "Identify and label core sliders"; Body = "**Summary**: Users mostly interact with a small number of sliders.`n`n**Details**: Identify 6 to 10 most used sliders, Label them as 'Core', Consider a small visual indicator.`n`n**Acceptance Criteria**: Core controls are visually distinct and easy to find."; Label = "Medium" },
        @{ Title = "Add Reset button to main UI"; Body = "**Summary**: Reset is currently only in a menu.`n`n**Details**: Add button near the slider area, One-click reset to default values.`n`n**Acceptance Criteria**: User can reset without opening menus."; Label = "Medium" },
        @{ Title = "Fullscreen toggle and keyboard shortcut"; Body = "**Summary**: Fullscreen is a common activity.`n`n**Details**: Add toggle to UI, Add keyboard shortcut (ex: F or Alt Enter), Fullscreen hides UI.`n`n**Acceptance Criteria**: User can enter and exit fullscreen easily."; Label = "High" }
    )
    "2.1 — Presets and Autosave" = @(
        @{ Title = "Implement simple preset format (JSON)"; Body = "**Summary**: Allow saving and loading of settings.`n`n**Details**: Save current UI state as JSON, Load JSON to restore settings, Store files in a presets directory.`n`n**Acceptance Criteria**: Presets can be saved, loaded, and deleted."; Label = "High" },
        @{ Title = "Preset manager UI"; Body = "**Summary**: Simple UI for preset selection.`n`n**Details**: List existing presets, Buttons: Save, Load, Delete, Minimal styling.`n`n**Acceptance Criteria**: User can manage presets from within the app."; Label = "High" },
        @{ Title = "Autosave last state on exit"; Body = "**Summary**: Restore state automatically when app restarts.`n`n**Details**: Save state before exit, Load state on startup.`n`n**Acceptance Criteria**: The app opens with the previous settings intact."; Label = "High" },
        @{ Title = "Bundle 8 to 12 presets"; Body = "**Summary**: Demonstrate possible uses of the app.`n`n**Details**: Include built-in presets (e.g., Soft Mirror, Portal Tunnel, Dream Blur, VHS Ghost, Kaleido Bloom).`n`n**Acceptance Criteria**: App ships with a set of sample presets."; Label = "Medium" }
    )
    "2.2 — Output Mode and Screensaver" = @(
        @{ Title = "Add Screensaver / Ambient mode"; Body = "**Summary**: Hide UI after inactivity or on command.`n`n**Details**: Trigger after X seconds, Or menu: 'Start Ambient Mode', UI fades out.`n`n**Acceptance Criteria**: App can run as an ambient visual on a monitor."; Label = "Medium" },
        @{ Title = "Preset slideshow with timing"; Body = "**Summary**: Cycle through presets automatically.`n`n**Details**: Time slider for duration, Crossfade if possible, Loop through presets.`n`n**Acceptance Criteria**: App cycles between presets hands-free."; Label = "Medium" },
        @{ Title = "Monitor selection for fullscreen"; Body = "**Summary**: Choose which display to use for output.`n`n**Details**: Detect displays, Dropdown to select, Fullscreen renders on that display.`n`n**Acceptance Criteria**: User can direct output to any connected monitor."; Label = "Low" }
    )
    "2.3 — Branding and Visual Identity" = @(
        @{ Title = "Explore new app name"; Body = "**Summary**: Original name was a placeholder.`n`n**Details**: Brainstorm 10 to 20 name options, Evaluate vibe and availability, Select one.`n`n**Acceptance Criteria**: App has a new name direction."; Label = "High" },
        @{ Title = "Create logo and splash screen"; Body = "**Summary**: Establish visual identity.`n`n**Details**: Draw or design a logo, Use during startup and in UI.`n`n**Acceptance Criteria**: App has a branded logo and splash."; Label = "Medium" },
        @{ Title = "App icon for Windows build"; Body = "**Summary**: Professional app experience.`n`n**Details**: Create .ico file, Bundle into build.`n`n**Acceptance Criteria**: Taskbar and installer show custom icon."; Label = "Low" },
        @{ Title = "Dark theme pass with consistent styling"; Body = "**Summary**: Cohesive visual look.`n`n**Details**: Align colors, fonts, UI elements, Hover and active states.`n`n**Acceptance Criteria**: UI feels polished and intentional."; Label = "High" }
    )
    "2.4 — Asset Export" = @(
        @{ Title = "Export current frame to PNG"; Body = "**Summary**: Allow saving still images.`n`n**Details**: Button: 'Save Frame', Save PNG to exports folder.`n`n**Acceptance Criteria**: User can export screen stills."; Label = "High" },
        @{ Title = "High resolution export mode"; Body = "**Summary**: Better for print and textiles.`n`n**Details**: Render a frame at 2x or 4x resolution, Save PNG.`n`n**Acceptance Criteria**: User can export high-quality stills."; Label = "Medium" }
    )
    "2.5 — Performance and Transition Smoothing" = @(
        @{ Title = "Add easing to snapshot transitions"; Body = "**Summary**: Reduce visual jumps.`n`n**Details**: Tween parameters over 250 to 1000 ms, Try easing functions.`n`n**Acceptance Criteria**: Transitions feel smooth."; Label = "Medium" },
        @{ Title = "Performance scaling option"; Body = "**Summary**: Small safety valve.`n`n**Details**: Low, Medium, High, Adjust internal resolution.`n`n**Acceptance Criteria**: Option available if needed."; Label = "Low" }
    )
}

$ghPath = "C:\Program Files\GitHub CLI\gh.exe"

# Get Repo Name
$repo = & $ghPath repo view --json owner,name --jq ".owner.login + '/' + .name"
Write-Host "Target Repo: $repo"

# Iterate and Create
foreach ($milestone in $ghParams.Keys) {
    Write-Host "Creating Milestone: $milestone"
    # Create milestone via API because 'gh milestone create' command might not exist or be different
    # gh api repos/:owner/:repo/milestones -f title="..."
    & $ghPath api "repos/$repo/milestones" -f title="$milestone" | Out-Null

    foreach ($issue in $ghParams[$milestone]) {
        Write-Host "  Creating Issue: $($issue.Title)"
        & $ghPath issue create --title "$($issue.Title)" --body "$($issue.Body)" --label "$($issue.Label)" --milestone "$milestone" | Out-Null
        Start-Sleep -Milliseconds 500 # Avoid rate limits
    }
}

Write-Host "Done!"
