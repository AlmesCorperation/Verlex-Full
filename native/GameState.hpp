#ifndef GAMESTATE_HPP
#define GAMESTATE_HPP

#include <unordered_map>
#include "packet.hpp"

struct PlayerState {
    float x, y, z;
    float yaw, pitch;
};

class GameState {
public:
    // Maps playerId to their current state
    std::unordered_map<uint32_t, PlayerState> players;

    void updatePlayer(const UpdatePayload& payload) {
        players[payload.playerId] = {
            payload.x, payload.y, payload.z,
            payload.yaw, payload.pitch
        };
    }
};

#endif