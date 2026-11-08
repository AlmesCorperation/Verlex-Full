#ifndef VERLEX_PACKET_PROCESSOR_HPP
#define VERLEX_PACKET_PROCESSOR_HPP

#include "GameState.hpp"
#include "packet.hpp"

class PacketProcessor {
public:
    explicit PacketProcessor(GameState& state);
    bool processPacket(const Packet& packet);

private:
    GameState& gameState;
};

#endif
