import glob

target_files = glob.glob("/Users/jeremiahpantaras/Downloads/PMS/frontend/src/features/landing/components/footer-pages/Legal/*.tsx")

for path in target_files:
    with open(path, 'r') as f:
        content = f.read()
    
    if "Malasakit Solutions" in content:
        if "SystemBranding" not in content:
            lines = content.split('\n')
            last_import_idx = 0
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import_idx = i
            lines.insert(last_import_idx + 1, "import { SystemBranding } from '@/config/branding';")
            content = '\n'.join(lines)
        
        content = content.replace("Malasakit Solutions", "{SystemBranding.companyName}")
        
        with open(path, 'w') as f:
            f.write(content)
        print(f"Updated {path}")
