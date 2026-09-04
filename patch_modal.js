const fs = require('fs');

// Patch ServerBrowserModal.tsx
let modalCode = fs.readFileSync('src/components/ServerBrowserModal.tsx', 'utf8');

modalCode = modalCode.replace(
  'activeRoomCode?: string;',
  'activeRoomCode?: string;\n  activePeerCount?: number;'
);

modalCode = modalCode.replace(
  'activeRoomCode,\n}) => {',
  'activeRoomCode,\n  activePeerCount,\n}) => {'
);

modalCode = modalCode.replace(
  '<span>{srv.playerCount}/{srv.maxPlayers}</span>',
  `<span>
                                {activeRoomCode === srv.roomCode && activePeerCount !== undefined
                                  ? activePeerCount + 1
                                  : srv.playerCount}
                                /{srv.maxPlayers}
                              </span>`
);

fs.writeFileSync('src/components/ServerBrowserModal.tsx', modalCode);

// Patch App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(
  'activeRoomCode={roomCode}',
  'activeRoomCode={roomCode}\n          activePeerCount={peerCount}'
);

appCode = appCode.replace(
  'activeRoomCode={roomCode}',
  'activeRoomCode={roomCode}\n        activePeerCount={peerCount}'
);

appCode = appCode.replace(
  "setCurrentSitePage('play_3d');",
  "setCurrentSitePage('play_3d');\n    serverRegistry.updatePlayerCount(server.roomCode, 1);"
);

fs.writeFileSync('src/App.tsx', appCode);

