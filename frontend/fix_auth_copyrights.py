import glob
import os

target_files = glob.glob("/Users/jeremiahpantaras/Downloads/PMS/frontend/src/features/auth/*.tsx")

for path in target_files:
    with open(path, 'r') as f:
        content = f.read()
    
    if "© 2026 Malasakit" in content:
        # Add import if missing
        if "SystemBranding" not in content:
            # Insert import after the last import line
            lines = content.split('\n')
            last_import_idx = 0
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import_idx = i
            lines.insert(last_import_idx + 1, "import { SystemBranding } from '@/config/branding';")
            content = '\n'.join(lines)
        
        # Replace the string
        content = content.replace("© 2026 Malasakit", "{SystemBranding.copyright}")
        
        with open(path, 'w') as f:
            f.write(content)
        print(f"Updated {path}")
