#ifndef VERLEX_PACKET_HPP
#define VERLEX_PACKET_HPP

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <limits>
#include <vector>

// Wire-format integers and IEEE-754 float bit patterns are little-endian.
// Never send the in-memory Packet structure directly over the network.
enum class PacketType : std::uint8_t {
    CONNECT = 0,
    UPDATE = 1,
    DISCONNECT = 2,
    PING = 3
};

struct PacketHeader {
    PacketType type;
    std::uint64_t timestamp;
};

struct UpdatePayload {
    std::uint32_t playerId;
    float x;
    float y;
    float z;
    float yaw;
    float pitch;
};

union PacketPayload {
    UpdatePayload update;
    std::uint32_t playerId;
    std::uint64_t pingId;

    PacketPayload() : pingId(0) {}
};

struct Packet {
    PacketHeader header;
    PacketPayload payload;

    Packet() : header{PacketType::PING, 0}, payload{} {}
};

namespace verlex_packet_detail {
constexpr std::size_t HEADER_SIZE = 9;
constexpr std::size_t UPDATE_SIZE = 24;
constexpr std::size_t PLAYER_ID_SIZE = 4;
constexpr std::size_t PING_SIZE = 8;

inline void writeU32(std::vector<std::uint8_t>& out, std::uint32_t value) {
    for (unsigned int i = 0; i < 4; ++i) {
        out.push_back(static_cast<std::uint8_t>((value >> (i * 8)) & 0xffU));
    }
}

inline void writeU64(std::vector<std::uint8_t>& out, std::uint64_t value) {
    for (unsigned int i = 0; i < 8; ++i) {
        out.push_back(static_cast<std::uint8_t>((value >> (i * 8)) & 0xffU));
    }
}

inline std::uint32_t readU32(const std::uint8_t* data) {
    std::uint32_t value = 0;
    for (unsigned int i = 0; i < 4; ++i) {
        value |= static_cast<std::uint32_t>(data[i]) << (i * 8);
    }
    return value;
}

inline std::uint64_t readU64(const std::uint8_t* data) {
    std::uint64_t value = 0;
    for (unsigned int i = 0; i < 8; ++i) {
        value |= static_cast<std::uint64_t>(data[i]) << (i * 8);
    }
    return value;
}

inline void writeFloat(std::vector<std::uint8_t>& out, float value) {
    static_assert(sizeof(float) == sizeof(std::uint32_t),
                  "Verlex packet protocol requires 32-bit floats");
    static_assert(std::numeric_limits<float>::is_iec559,
                  "Verlex packet protocol requires IEEE-754 floats");
    std::uint32_t bits = 0;
    std::memcpy(&bits, &value, sizeof(bits));
    writeU32(out, bits);
}

inline float readFloat(const std::uint8_t* data) {
    const std::uint32_t bits = readU32(data);
    float value = 0.0F;
    std::memcpy(&value, &bits, sizeof(value));
    return value;
}
} // namespace verlex_packet_detail

constexpr std::size_t VERLEX_PACKET_HEADER_SIZE = 9;
constexpr std::size_t VERLEX_PACKET_MAX_SIZE = 33;

inline bool encodePacket(const Packet& packet, std::vector<std::uint8_t>& output) {
    using namespace verlex_packet_detail;
    output.clear();
    output.reserve(VERLEX_PACKET_MAX_SIZE);

    const auto rawType = static_cast<std::uint8_t>(packet.header.type);
    if (rawType > static_cast<std::uint8_t>(PacketType::PING)) {
        return false;
    }

    output.push_back(rawType);
    writeU64(output, packet.header.timestamp);

    switch (packet.header.type) {
        case PacketType::CONNECT:
        case PacketType::DISCONNECT:
            writeU32(output, packet.payload.playerId);
            break;
        case PacketType::UPDATE:
            writeU32(output, packet.payload.update.playerId);
            writeFloat(output, packet.payload.update.x);
            writeFloat(output, packet.payload.update.y);
            writeFloat(output, packet.payload.update.z);
            writeFloat(output, packet.payload.update.yaw);
            writeFloat(output, packet.payload.update.pitch);
            break;
        case PacketType::PING:
            writeU64(output, packet.payload.pingId);
            break;
        default:
            output.clear();
            return false;
    }

    return true;
}

inline bool decodePacket(const std::uint8_t* data, std::size_t size, Packet& output) {
    using namespace verlex_packet_detail;
    if (data == nullptr || size < HEADER_SIZE || size > VERLEX_PACKET_MAX_SIZE) {
        return false;
    }

    const auto rawType = data[0];
    if (rawType > static_cast<std::uint8_t>(PacketType::PING)) {
        return false;
    }

    const auto type = static_cast<PacketType>(rawType);
    std::size_t expectedSize = HEADER_SIZE;
    switch (type) {
        case PacketType::CONNECT:
        case PacketType::DISCONNECT:
            expectedSize += PLAYER_ID_SIZE;
            break;
        case PacketType::UPDATE:
            expectedSize += UPDATE_SIZE;
            break;
        case PacketType::PING:
            expectedSize += PING_SIZE;
            break;
        default:
            return false;
    }

    if (size != expectedSize) {
        return false;
    }

    Packet decoded;
    decoded.header.type = type;
    decoded.header.timestamp = readU64(data + 1);
    const std::uint8_t* payload = data + HEADER_SIZE;

    switch (type) {
        case PacketType::CONNECT:
        case PacketType::DISCONNECT:
            decoded.payload.playerId = readU32(payload);
            break;
        case PacketType::UPDATE:
            decoded.payload.update.playerId = readU32(payload);
            decoded.payload.update.x = readFloat(payload + 4);
            decoded.payload.update.y = readFloat(payload + 8);
            decoded.payload.update.z = readFloat(payload + 12);
            decoded.payload.update.yaw = readFloat(payload + 16);
            decoded.payload.update.pitch = readFloat(payload + 20);
            break;
        case PacketType::PING:
            decoded.payload.pingId = readU64(payload);
            break;
        default:
            return false;
    }

    output = decoded;
    return true;
}

#endif
