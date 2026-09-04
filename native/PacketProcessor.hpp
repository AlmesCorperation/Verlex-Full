#ifndef PACKETPROCESSOR_HPP
#define PACKETPROCESSOR_HPP

#include "packet.hpp"
#include "GameState.hpp"

// Declare Rust function (bridging C++ and Rust)
extern "C" {
    void rust_function(); 
}

class PacketProcessor {
public:
    PacketProcessor(GameState& gs) : gameState(gs) {}
    void processPacket(const Packet& p);
private:
    GameState& gameState;
};
#endif