#ifndef VERLEX_GAME_STATE_HPP
#define VERLEX_GAME_STATE_HPP

#include "packet.hpp"

#include <cstddef>
#include <cstdint>
#include <unordered_map>

struct PlayerState {
    float x = 0.0F;
    float y = 0.0F;
    float z = 0.0F;
    float yaw = 0.0F;
    float pitch = 0.0F;
};

class GameState {
public:
    void connectPlayer(std::uint32_t playerId) {
        players.emplace(playerId, PlayerState{});
    }

    void updatePlayer(const UpdatePayload& payload) {
        players[payload.playerId] = PlayerState{
            payload.x, payload.y, payload.z, payload.yaw, payload.pitch
        };
    }

    void disconnectPlayer(std::uint32_t playerId) {
        players.erase(playerId);
    }

    std::size_t playerCount() const {
        return players.size();
    }

    const std::unordered_map<std::uint32_t, PlayerState>& getPlayers() const {
        return players;
    }

private:
    std::unordered_map<std::uint32_t, PlayerState> players;
};

#endif
