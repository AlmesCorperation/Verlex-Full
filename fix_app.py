import os
with open('src/App.tsx', 'r') as f:
    c = f.read()
c = c.replace('          activePeerCount={peerCount}\n          activePeerCount={peerCount}', '          activePeerCount={peerCount}')
with open('src/App.tsx', 'w') as f:
    f.write(c)
