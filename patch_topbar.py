import os

# Remove back button from App.tsx
with open('src/App.tsx', 'r') as f:
    app = f.read()

app = app.replace('''        {/* Return to  Website Navigation Button (Top Left) */}
        <button
          id="back-to-site-btn"
          onClick={() => {
            sounds.playClick();
            setCurrentSitePage('home');
          }}
          className="absolute top-3.5 left-3 z-30 flex items-center space-x-1.5 bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] hover:brightness-105 border-2 border-[#b87d00] text-black font-black text-xs px-3 py-1.5 rounded-sm shadow-md active:translate-y-0.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>&larr; Exit to VERLEX Site</span>
        </button>''', '')

with open('src/App.tsx', 'w') as f:
    f.write(app)

# Add Exit button to Topbar
with open('src/components/Topbar.tsx', 'r') as f:
    top = f.read()

# Add onExit prop
top = top.replace('interface TopbarProps {', 'interface TopbarProps {\n  onExit: () => void;')
top = top.replace('  onToggleShiftLock,\n}) => {', '  onToggleShiftLock,\n  onExit,\n}) => {')
top = top.replace('import { MapTemplateId } from \'../types\';', 'import { MapTemplateId } from \'../types\';\nimport { ArrowLeft } from \'lucide-react\';')

# Insert before Verlex Logo
logo_code = '''        {/* Verlex Logo */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-neutral-800 rounded-lg border border-neutral-700 shadow-sm">'''
exit_btn = '''        {/* Exit Button */}
        <button
          onClick={onExit}
          className="flex sm:hidden lg:flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-2 py-1 rounded-lg shadow-sm font-bold text-xs transition-colors"
          title="Exit to Site"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xl:inline">Exit</span>
        </button>
        
        {/* Verlex Logo */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-neutral-800 rounded-lg border border-neutral-700 shadow-sm">'''
top = top.replace(logo_code, exit_btn)

with open('src/components/Topbar.tsx', 'w') as f:
    f.write(top)

