#include "PacketProcessor.hpp"
#include <iostream>

void PacketProcessor::processPacket(const Packet& p) {
    switch(p.header.type) {
        case PacketType::UPDATE:
            // Update the game state based on the payload
            gameState.updatePlayer(p.payload.update);
            
            // Trigger high-performance Rust logic (e.g., collision detection)
            rust_function();
            break;
            
        case PacketType::CONNECT:
            std::cout << "Player connecting..." << std::endl;
            break;
            
        default:
            break;
    }
}