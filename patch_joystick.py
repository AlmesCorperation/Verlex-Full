import os

filepath = 'src/components/MobileControls.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add state for joystick position
state_old = "const joystickRef = useRef<HTMLDivElement>(null);"
state_new = "const joystickRef = useRef<HTMLDivElement>(null);\n  const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });"
content = content.replace(state_old, state_new)

# Update handleJoystickTouch
touch_old = "engine.virtualJoystickMove.y = -(dy / maxDist);"
touch_new = "engine.virtualJoystickMove.y = -(dy / maxDist);\n    setThumbPos({ x: dx, y: dy });"
content = content.replace(touch_old, touch_new)

# Update resetJoystick
reset_old = "engine.virtualJoystickMove.set(0, 0);"
reset_new = "engine.virtualJoystickMove.set(0, 0);\n      setThumbPos({ x: 0, y: 0 });"
content = content.replace(reset_old, reset_new)

# Update render
render_old = '<div className="w-12 h-12 bg-white/40 rounded-full shadow-lg"></div>'
render_new = '<div className="w-12 h-12 bg-white/40 rounded-full shadow-lg" style={{ transform: `translate(${thumbPos.x}px, ${thumbPos.y}px)` }}></div>'
content = content.replace(render_old, render_new)

with open(filepath, 'w') as f:
    f.write(content)

