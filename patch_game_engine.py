import os

filepath = 'src/game/GameEngine.ts'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add virtual joystick properties
props_old = 'public keysPressed: Set<string> = new Set();'
props_new = '''public keysPressed: Set<string> = new Set();
  public virtualJoystickMove: THREE.Vector2 = new THREE.Vector2();
  public virtualJumpPressed: boolean = false;'''
content = content.replace(props_old, props_new)

# 2. Add touch event handlers inside constructor
touch_code = '''
    const activeTouches = new Map<number, { x: number, y: number, startX: number, startY: number, moved: boolean }>();
    const onTouchStart = (e: TouchEvent) => {
      if (document.activeElement && document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY, startX: t.clientX, startY: t.clientY, moved: false });
      }
    };
    
    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const last = activeTouches.get(t.identifier);
        if (last) {
          const movementX = t.clientX - last.x;
          const movementY = t.clientY - last.y;
          if (Math.abs(t.clientX - last.startX) > 8 || Math.abs(t.clientY - last.startY) > 8) {
            last.moved = true;
          }
          this.cameraYaw -= movementX * 0.005;
          this.cameraPitch = Math.max(-1.2, Math.min(1.4, this.cameraPitch + movementY * 0.005));
          last.x = t.clientX;
          last.y = t.clientY;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const last = activeTouches.get(t.identifier);
        if (last && !last.moved) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            this.mousePos.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
            this.mousePos.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
            this.handleToolAction();
          }
        }
        activeTouches.delete(t.identifier);
      }
    };
    
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
'''

# Insert after wheel listener
wheel_listener = "el.addEventListener('wheel', onWheel, { passive: false });"
content = content.replace(wheel_listener, wheel_listener + touch_code)

# Insert cleanup
cleanup_old = "el.removeEventListener('wheel', onWheel);"
cleanup_new = """el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);"""
content = content.replace(cleanup_old, cleanup_new)

# 3. Update character movement to include virtual inputs
move_old = '''const isForward = this.keysPressed.has('KeyW') || this.keysPressed.has('w') || this.keysPressed.has('W') || this.keysPressed.has('ArrowUp');
    const isBackward = this.keysPressed.has('KeyS') || this.keysPressed.has('s') || this.keysPressed.has('S') || this.keysPressed.has('ArrowDown');
    const isLeft = this.keysPressed.has('KeyA') || this.keysPressed.has('a') || this.keysPressed.has('A');
    const isRight = this.keysPressed.has('KeyD') || this.keysPressed.has('d') || this.keysPressed.has('D');
    const isJump = this.keysPressed.has('Space') || this.keysPressed.has(' ');

    const inputMove = new THREE.Vector3();
    if (isForward) inputMove.add(forward);
    if (isBackward) inputMove.sub(forward);
    if (isLeft) inputMove.sub(right);
    if (isRight) inputMove.add(right);

    const isMoving = inputMove.lengthSq() > 0.01;
    if (isMoving) {
      inputMove.normalize();
    }'''

move_new = '''const isForward = this.keysPressed.has('KeyW') || this.keysPressed.has('w') || this.keysPressed.has('W') || this.keysPressed.has('ArrowUp');
    const isBackward = this.keysPressed.has('KeyS') || this.keysPressed.has('s') || this.keysPressed.has('S') || this.keysPressed.has('ArrowDown');
    const isLeft = this.keysPressed.has('KeyA') || this.keysPressed.has('a') || this.keysPressed.has('A');
    const isRight = this.keysPressed.has('KeyD') || this.keysPressed.has('d') || this.keysPressed.has('D');
    const isJump = this.keysPressed.has('Space') || this.keysPressed.has(' ') || this.virtualJumpPressed;

    const inputMove = new THREE.Vector3();
    if (isForward) inputMove.add(forward);
    if (isBackward) inputMove.sub(forward);
    if (isLeft) inputMove.sub(right);
    if (isRight) inputMove.add(right);
    
    // Add analog joystick input
    if (Math.abs(this.virtualJoystickMove.y) > 0.05) {
      inputMove.addScaledVector(forward, this.virtualJoystickMove.y);
    }
    if (Math.abs(this.virtualJoystickMove.x) > 0.05) {
      inputMove.addScaledVector(right, this.virtualJoystickMove.x);
    }

    const isMoving = inputMove.lengthSq() > 0.01;
    if (isMoving) {
      if (inputMove.lengthSq() > 1) inputMove.normalize();
    }'''

content = content.replace(move_old, move_new)

with open(filepath, 'w') as f:
    f.write(content)

