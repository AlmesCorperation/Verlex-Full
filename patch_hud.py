import os

filepath = 'src/App.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="absolute bottom-20 left-4 z-10 flex items-center gap-3 bg-neutral-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-neutral-800 text-white shadow-xl pointer-events-none">',
    '<div className="absolute top-16 right-2 sm:right-4 sm:top-auto sm:bottom-20 sm:left-4 z-10 flex items-center gap-2 sm:gap-3 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-neutral-800 text-white shadow-xl pointer-events-none">'
)

with open(filepath, 'w') as f:
    f.write(content)
