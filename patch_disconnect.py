import os

filepath = 'src/game/GameEngine.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_hook = """    network.onPeerDisconnect = (peerId) => {
      const avatar = this.remotePlayers.get(peerId);
      if (avatar) {
        this.scene.remove(avatar.rootGroup);
        this.remotePlayers.delete(peerId);
      }
    };"""

new_hook = """    // Handled in App.tsx -> engine.handlePeerDisconnect
  }

  public handlePeerDisconnect(peerId: string) {
    const avatar = this.remotePlayers.get(peerId);
    if (avatar) {
      this.scene.remove(avatar.rootGroup);
      this.remotePlayers.delete(peerId);
    }
"""

content = content.replace(old_hook, new_hook)

with open(filepath, 'w') as f:
    f.write(content)

filepath = 'src/App.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_app = """    network.onPeerDisconnect = (peerId) => {
      const count = network.connections.size;"""

new_app = """    network.onPeerDisconnect = (peerId) => {
      if (engineRef.current) engineRef.current.handlePeerDisconnect(peerId);
      const count = network.connections.size;"""

content = content.replace(old_app, new_app)

with open(filepath, 'w') as f:
    f.write(content)

