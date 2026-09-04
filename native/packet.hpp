#ifndef VERLEX_PACKET_HPP
#define VERLEX_PACKET_HPP

#include <cstdint>

// Ensure the structure is packed to avoid compiler padding
// This makes the packet size consistent across different systems/compilers.
#pragma pack(push, 1)

enum class PacketType : uint8_t {
    CONNECT = 0,
    UPDATE = 1,
    DISCONNECT = 2,
    PING = 3
};

struct PacketHeader {
    PacketType type;
    uint64_t timestamp; // Epoch ms
};

struct UpdatePayload {
    uint32_t playerId;
    float x, y, z;
    float yaw, pitch;
};

// Represents the full packet structure
struct Packet {
    PacketHeader header;
    union {
        UpdatePayload update;
        // Future payloads can be added here (e.g., chat, actions)
        uint64_t pingId; 
    } payload;
};

#pragma pack(pop)

#endif
