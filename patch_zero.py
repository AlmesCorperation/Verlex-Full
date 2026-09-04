import os

def replace_counts(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace specific fake player counts
    replacements = {
        'players: 142': 'players: 0',
        'players: 89': 'players: 0',
        'players: 64': 'players: 0',
        'players: 120': 'players: 0',
        'players: 95': 'players: 0',
    }

    for k, v in replacements.items():
        content = content.replace(k, v)

    with open(filepath, 'w') as f:
        f.write(content)

replace_counts('src/components/HomePage.tsx')
replace_counts('src/components/GamesPage.tsx')

with open('src/services/serverRegistry.ts', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if i < 100 and 'playerCount:' in line:
        lines[i] = line.replace('playerCount: 3', 'playerCount: 0')
        lines[i] = lines[i].replace('playerCount: 2', 'playerCount: 0')
        lines[i] = lines[i].replace('playerCount: 4', 'playerCount: 0')
        lines[i] = lines[i].replace('playerCount: 1', 'playerCount: 0')

with open('src/services/serverRegistry.ts', 'w') as f:
    f.writelines(lines)

