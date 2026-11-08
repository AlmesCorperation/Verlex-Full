#include "PacketProcessor.hpp"

#include <cmath>
#include <cstdint>

#ifdef VERLEX_WITH_RUST
extern "C" std::uint8_t verlex_rust_position_is_valid(float x, float y, float z);
#endif

PacketProcessor::PacketProcessor(GameState& state) : gameState(state) {}

bool PacketProcessor::processPacket(const Packet& packet) {
    switch (packet.header.type) {
        case PacketType::CONNECT:
            gameState.connectPlayer(packet.payload.playerId);
            return true;

        case PacketType::UPDATE: {
            const UpdatePayload& update = packet.payload.update;
            if (!std::isfinite(update.x) || !std::isfinite(update.y) ||
                !std::isfinite(update.z) || !std::isfinite(update.yaw) ||
                !std::isfinite(update.pitch)) {
                return false;
            }

#ifdef VERLEX_WITH_RUST
            if (verlex_rust_position_is_valid(update.x, update.y, update.z) == 0) {
                return false;
            }
#endif
            gameState.updatePlayer(update);
            return true;
        }

        case PacketType::DISCONNECT:
            gameState.disconnectPlayer(packet.payload.playerId);
            return true;

        case PacketType::PING:
            return true;
    }

    return false;
}
