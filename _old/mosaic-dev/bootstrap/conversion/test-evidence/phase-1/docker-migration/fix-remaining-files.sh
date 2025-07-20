#!/bin/bash

# Fix remaining docker-compose usage in specific files

set -euo pipefail

echo "Fixing remaining docker-compose usage..."

# Fix markdown files in infrastructure directories
files_to_fix=(
    "/home/jwoltje/src/tony-ng/tony-ng/infrastructure/backup-recovery/README.md"
    "/home/jwoltje/src/tony-ng/tony-ng/infrastructure/backup-recovery/docs/recovery-procedures.md"
    "/home/jwoltje/src/tony-ng/tony-ng/infrastructure/performance-security/README.md"
    "/home/jwoltje/src/tony-ng/tony-ng/infrastructure/performance-security/documentation/security-procedures.md"
    "/home/jwoltje/src/tony-ng/tony-ng/docs/deployment/README.md"
    "/home/jwoltje/src/tony-ng/tony-ng/docs/developer-guide/setup/development-environment.md"
    "/home/jwoltje/src/tony-ng/tony-ng/docs/developer-guide/README.md"
    "/home/jwoltje/src/tony-ng/tony-ng/README.md"
)

# Fix shell scripts
shell_scripts=(
    "/home/jwoltje/src/tony-ng/tony-ng/infrastructure/backup-recovery/scripts/disaster-recovery/restore-application.sh"
    "/home/jwoltje/src/tony-ng/tony-ng/infrastructure/backup-recovery/scripts/application/backup-application.sh"
    "/home/jwoltje/src/tony-ng/tony-ng/infrastructure/performance-security/scripts/optimization-automation.sh"
    "/home/jwoltje/src/tony-ng/tony-ng/infrastructure/performance-security/scripts/performance-tuning.sh"
)

# Function to fix file
fix_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Fixing: $file"
        # Replace docker-compose commands but preserve docker-compose.yml filenames
        sed -i 's/docker-compose up/docker compose up/g' "$file"
        sed -i 's/docker-compose down/docker compose down/g' "$file"
        sed -i 's/docker-compose ps/docker compose ps/g' "$file"
        sed -i 's/docker-compose exec/docker compose exec/g' "$file"
        sed -i 's/docker-compose logs/docker compose logs/g' "$file"
        sed -i 's/docker-compose build/docker compose build/g' "$file"
        sed -i 's/docker-compose start/docker compose start/g' "$file"
        sed -i 's/docker-compose stop/docker compose stop/g' "$file"
        sed -i 's/docker-compose restart/docker compose restart/g' "$file"
        sed -i 's/docker-compose pull/docker compose pull/g' "$file"
        sed -i 's/docker-compose -f/docker compose -f/g' "$file"
        sed -i 's/docker-compose --version/docker compose version/g' "$file"
        sed -i 's/docker-compose-v2/docker-compose-v2/g' "$file"  # Keep package names
        sed -i 's/install docker-compose/install docker-compose/g' "$file"  # Keep install commands referencing the package
    else
        echo "File not found: $file"
    fi
}

# Fix all files
for file in "${files_to_fix[@]}"; do
    fix_file "$file"
done

for file in "${shell_scripts[@]}"; do
    fix_file "$file"
done

# Fix YAML files
echo "Fixing YAML configuration files..."
find /home/jwoltje/src/tony-ng/tony-ng/infrastructure -name "*.yml" -type f -exec grep -l "docker-compose " {} \; | while read -r file; do
    echo "Fixing: $file"
    sed -i 's/docker-compose /docker compose /g' "$file"
done

echo "Done!"