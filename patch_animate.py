import os

filepath = 'src/game/GameEngine.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_hook = '''        if (state.animState) {
          avatar.updateAnimation(0.016, state.animState, 2);
        }'''

new_hook = '''        if (state.animState) {
          (avatar as any).targetAnimState = state.animState;
          (avatar as any).targetHorizSpeed = state.velocity ? Math.sqrt(state.velocity[0]*state.velocity[0] + state.velocity[2]*state.velocity[2]) : 2;
        }'''

content = content.replace(old_hook, new_hook)

old_animate = '''    // 5. Update Camera Orbit / Follow
    this.updateCamera(delta);'''

new_animate = '''    // 5. Update Camera Orbit / Follow
    this.updateCamera(delta);

    // 6. Smooth Remote Player Animations
    this.remotePlayers.forEach((avatar) => {
      avatar.updateAnimation(delta, (avatar as any).targetAnimState || 'idle', (avatar as any).targetHorizSpeed || 0);
    });'''

content = content.replace(old_animate, new_animate)

with open(filepath, 'w') as f:
    f.write(content)

