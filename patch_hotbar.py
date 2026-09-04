import os

filepath = 'src/components/Hotbar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    'className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-700/80 shadow-2xl select-none"',
    'className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-30 flex flex-wrap justify-center sm:flex-nowrap items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-700/80 shadow-2xl select-none w-[96vw] sm:w-auto max-w-[550px]"'
)

content = content.replace(
    'className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-150 ${',
    'className={`relative flex flex-col items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-xl transition-all duration-150 ${'
)

with open(filepath, 'w') as f:
    f.write(content)

