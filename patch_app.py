import os

filepath = 'src/App.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Import MobileControls
import_old = "import { HelpModal } from './components/HelpModal';"
import_new = "import { HelpModal } from './components/HelpModal';\nimport { MobileControls } from './components/MobileControls';"
content = content.replace(import_old, import_new)

# Add state for engine ready
state_old = "const engineRef = useRef<GameEngine | null>(null);"
state_new = "const engineRef = useRef<GameEngine | null>(null);\n  const [engineReady, setEngineReady] = useState(false);"
content = content.replace(state_old, state_new)

# Set state when engine is ready
ready_old = "engineRef.current = engine;"
ready_new = "engineRef.current = engine;\n    setEngineReady(true);"
content = content.replace(ready_old, ready_new)

# Reset state when destroyed
destroy_old = "engineRef.current = null;"
destroy_new = "engineRef.current = null;\n        setEngineReady(false);"
content = content.replace(destroy_old, destroy_new)

# Render MobileControls before Hotbar
render_old = "{/* Bottom Backpack / Hotbar (Keys 1-8) */}"
render_new = "{/* Mobile Touch Controls */}\n        {engineReady && <MobileControls engine={engineRef.current} />}\n\n        {/* Bottom Backpack / Hotbar (Keys 1-8) */}"
content = content.replace(render_old, render_new)

with open(filepath, 'w') as f:
    f.write(content)

