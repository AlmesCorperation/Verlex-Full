import os

def replace_in_file(filepath, old, new):
    with open(filepath, 'r') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)

app_old_handle = """  const handleLaunch3DGame = (mapId: MapTemplateId = 'crossroads') => {
    const def = serverRegistry.getDefaultServerForMap(mapId);
    handleJoinServer(def);
  };"""

app_new_handle = """  const handleLaunch3DGame = (mapId: MapTemplateId = 'crossroads') => {
    let roomCode = `P2P-${Math.floor(1000 + Math.random() * 9000)}`;
    let maxPlayers = 12;
    let name = 'My Personal Sandbox';

    if (mapId === 'studio_map') {
      try {
        const studioNet = JSON.parse(localStorage.getItem('verlex_studio_network') || '{}');
        if (studioNet.roomCode) roomCode = studioNet.roomCode;
        if (studioNet.maxPlayers) maxPlayers = studioNet.maxPlayers;
        name = 'Verlex Studio Run';
      } catch (e) {}
      
      const hostServer: GameServer = {
        id: `srv_${Date.now()}`,
        roomCode: roomCode,
        mapId,
        name: name,
        hostName: playerName,
        playerCount: 1,
        maxPlayers: maxPlayers,
        region: 'Local / P2P',
        ping: 0,
        createdAt: Date.now(),
        isCustom: true,
      };
      
      handleJoinServer(hostServer);
      return;
    }

    const def = serverRegistry.getDefaultServerForMap(mapId);
    handleJoinServer(def);
  };"""

replace_in_file('src/App.tsx', app_old_handle, app_new_handle)
