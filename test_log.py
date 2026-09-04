import os

filepath = 'src/game/GameEngine.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_code = """      if (!avatar && state.avatar) {
        avatar = new AvatarRig(state.name || 'Player', state.avatar);
        this.remotePlayers.set(peerId, avatar);
        this.scene.add(avatar.rootGroup);
      }"""

new_code = """      if (!avatar && state.avatar) {
        console.log('Spawning remote player avatar for:', peerId, state.name);
        avatar = new AvatarRig(state.name || 'Player', state.avatar);
        this.remotePlayers.set(peerId, avatar);
        this.scene.add(avatar.rootGroup);
      }"""

content = content.replace(old_code, new_code)
with open(filepath, 'w') as f:
    f.write(content)

