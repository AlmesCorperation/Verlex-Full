import os

def replace_in_file(filepath, old, new):
    with open(filepath, 'r') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)

# Patch ServerBrowserModal.tsx
modal_old1 = 'activeRoomCode?: string;'
modal_new1 = 'activeRoomCode?: string;\n  activePeerCount?: number;'
replace_in_file('src/components/ServerBrowserModal.tsx', modal_old1, modal_new1)

modal_old2 = 'activeRoomCode,\n}) => {'
modal_new2 = 'activeRoomCode,\n  activePeerCount,\n}) => {'
replace_in_file('src/components/ServerBrowserModal.tsx', modal_old2, modal_new2)

modal_old3 = '<span>{srv.playerCount}/{srv.maxPlayers}</span>'
modal_new3 = """<span>
                                {activeRoomCode === srv.roomCode && activePeerCount !== undefined
                                  ? activePeerCount + 1
                                  : srv.playerCount}
                                /{srv.maxPlayers}
                              </span>"""
replace_in_file('src/components/ServerBrowserModal.tsx', modal_old3, modal_new3)

# Patch App.tsx
app_old1 = 'activeRoomCode={roomCode}'
app_new1 = 'activeRoomCode={roomCode}\n          activePeerCount={peerCount}'
replace_in_file('src/App.tsx', app_old1, app_new1)
# Note that in App.tsx there are two instances of activeRoomCode={roomCode} and both will be replaced, but one is indented 10 spaces and one 8 spaces. So the spacing will be slightly off but acceptable.

# Actually let's do it safely:
with open('src/App.tsx', 'r') as f:
    app_code = f.read()

app_code = app_code.replace(
    'activeRoomCode={roomCode}',
    'activeRoomCode={roomCode}\n          activePeerCount={peerCount}'
)

app_code = app_code.replace(
    "setCurrentSitePage('play_3d');",
    "setCurrentSitePage('play_3d');\n    serverRegistry.updatePlayerCount(server.roomCode, 1);"
)

with open('src/App.tsx', 'w') as f:
    f.write(app_code)

