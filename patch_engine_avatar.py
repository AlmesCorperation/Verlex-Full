import os

filepath = 'src/game/GameEngine.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Store avatarConfig
old_prop = 'public playerName: string = \'Player1\';'
new_prop = 'public playerName: string = \'Player1\';\n  public avatarConfig: AvatarConfig;'
content = content.replace(old_prop, new_prop)

old_ctor = 'this.playerName = playerName;'
new_ctor = 'this.playerName = playerName;\n    this.avatarConfig = avatarConfig;'
content = content.replace(old_ctor, new_ctor)

# Broadcast avatarConfig
old_sync = """    const state: Partial<PlayerState> = {
      name: this.playerName,
      position: [charPos.x, charPos.y - 2.1, charPos.z],"""
new_sync = """    const state: Partial<PlayerState> = {
      name: this.playerName,
      avatar: this.avatarConfig,
      position: [charPos.x, charPos.y - 2.1, charPos.z],"""
content = content.replace(old_sync, new_sync)

with open(filepath, 'w') as f:
    f.write(content)

