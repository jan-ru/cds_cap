#!/bin/bash

# Remove karma, UI5 v3, and other deprecated dependencies from app package.json files
# Apps will use WDIO for testing and inherit UI5 v4 from root

cd /root/projects/cds_cap/app

echo "Removing karma and deprecated dependencies from apps..."
echo "Apps will use WDIO for testing instead."
echo ""

DEPS_TO_REMOVE=(
  # Karma (deprecated, being replaced by WDIO)
  "karma"
  "karma-ui5"
  "karma-chrome-launcher"
  "karma-coverage"
  "karma-junit-reporter"
  # Old UI5 versions
  "@ui5/cli"
  "@ui5/fs"
  "@ui5/logger"
  "@ui5/server"
  "@ui5/project"
  "@ui5/builder"
  # WDIO (should be inherited from root)
  "@wdio/cli"
  "@wdio/local-runner"
  "@wdio/mocha-framework"
  "@wdio/spec-reporter"
  "@wdio/utils"
  "chromedriver"
  "wdio-chromedriver-service"
  # ESLint (should be inherited from root)
  "eslint"
)

for dir in */; do
    # Skip special directories
    if [ "$dir" = "shared/" ] || [ "$dir" = "ui5/" ] || [ "$dir" = "node_modules/" ]; then
        continue
    fi
    
    if [ -f "$dir/package.json" ]; then
        echo "Processing $dir..."
        
        changed=false
        
        # Check if any dependencies need to be removed
        for dep in "${DEPS_TO_REMOVE[@]}"; do
            if grep -q "\"$dep\"" "$dir/package.json"; then
                echo "  Removing $dep"
                changed=true
                
                # Use npm uninstall to properly remove
                cd "$dir"
                npm uninstall "$dep" 2>/dev/null
                cd ..
            fi
        done
        
        # Also remove karma.conf.js if it exists
        if [ -f "$dir/karma.conf.js" ]; then
            echo "  Removing karma.conf.js (use wdio.conf.js instead)"
            rm "$dir/karma.conf.js"
            changed=true
        fi
        
        if [ "$changed" = true ]; then
            echo "  ✓ Updated $dir"
        else
            echo "  - No changes needed"
        fi
        echo ""
    fi
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. cd /root/projects/cds_cap"
echo "2. rm -rf node_modules package-lock.json app/*/node_modules"
echo "3. npm install"
echo ""
echo "Note: Apps should now use wdio.conf.js for testing instead of karma.conf.js"
