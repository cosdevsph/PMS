import glob

target_files = [
    "/Users/jeremiahpantaras/Downloads/PMS/frontend/src/features/setup/pages/communication/CommunicationLogs.tsx",
    "/Users/jeremiahpantaras/Downloads/PMS/frontend/src/features/patients/PatientCommunicationHistoryPage.tsx"
]

for path in target_files:
    with open(path, 'r') as f:
        content = f.read()
    
    if "Malasakit Medical Systems" in content:
        if "SystemBranding" not in content:
            lines = content.split('\n')
            last_import_idx = 0
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import_idx = i
            lines.insert(last_import_idx + 1, "import { SystemBranding } from '@/config/branding';")
            content = '\n'.join(lines)
        
        content = content.replace("Malasakit Medical Systems", "{SystemBranding.companyName}")
        
        with open(path, 'w') as f:
            f.write(content)
        print(f"Updated {path}")
