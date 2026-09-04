import os
import glob
import re

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)

files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)

# Replacements to clean up the names and dates
replacements = {
    '2026': '',
    '2007': '',
    '2006': '',
    '2008': '',
    'ClassicAvatarPreview': 'AvatarPreview',
    'ModernAvatarPreview': 'AvatarPreview',
    'Header2007': 'Header',
    'Header2026': 'Header',
    'Footer2007': 'Footer',
    'Footer2026': 'Footer',
    'Retro': '',
    'retro': '',
    'Modern ': '',
    'modern ': '',
    'Modern': '',
    'modern': '',
    'Classic ': '',
    'classic ': '',
    'Classic': '',
    'classic': ''
}

for filepath in files:
    replace_in_file(filepath, replacements)

# Rename files if they exist
rename_map = {
    'src/components/ClassicAvatarPreview.tsx': 'src/components/AvatarPreview.tsx',
    'src/components/ModernAvatarPreview.tsx': 'src/components/AvatarPreview.tsx',
    'src/components/Header2007.tsx': 'src/components/Header.tsx',
    'src/components/Footer2007.tsx': 'src/components/Footer.tsx'
}

for old, new in rename_map.items():
    if os.path.exists(old):
        os.rename(old, new)

print("Done")
