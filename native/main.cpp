#include "PacketProcessor.hpp"
#include "engine.hpp"
#include "network.hpp"
#include "physics.h"

#include <cerrno>
#include <csignal>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <string>
#include <vector>

namespace {
volatile std::sig_atomic_t serverRunning = 1;

void handleSignal(int) {
    serverRunning = 0;
}

bool parsePort(const char* text, std::uint16_t& port) {
    if (text == nullptr || *text == '\0') {
        return false;
    }

    errno = 0;
    char* end = nullptr;
    const long value = std::strtol(text, &end, 10);
    if (errno != 0 || end == text || *end != '\0' ||
        value < 1 || value > 65535) {
        return false;
    }

    port = static_cast<std::uint16_t>(value);
    return true;
}

int runSelfTest() {
    Packet original;
    original.header.type = PacketType::UPDATE;
    original.header.timestamp = 123456789ULL;
    original.payload.update = UpdatePayload{7, 1.5F, 12.0F, -3.25F, 90.0F, 5.0F};

    std::vector<std::uint8_t> encoded;
    Packet decoded;
    if (!encodePacket(original, encoded) ||
        !decodePacket(encoded.data(), encoded.size(), decoded) ||
        decoded.header.type != PacketType::UPDATE ||
        decoded.payload.update.playerId != 7 ||
        decoded.payload.update.x != 1.5F) {
        std::cerr << "[FAIL] Packet encode/decode round trip" << std::endl;
        return 1;
    }
    std::cout << "[PASS] Packet encode/decode round trip" << std::endl;

    GameState state;
    PacketProcessor processor(state);
    if (!processor.processPacket(decoded) || state.playerCount() != 1) {
        std::cerr << "[FAIL] Game-state packet processing" << std::endl;
        return 1;
    }
    std::cout << "[PASS] Game-state packet processing" << std::endl;

    VerlexPhysicsBody body{{0.0F, 10.0F, 0.0F},
                           {0.0F, 0.0F, 0.0F}, 0};
    const VerlexPhysicsConfig physicsConfig{{0.0F, -10.0F, 0.0F}, 0.1F};
    if (verlex_physics_step(&body, 1, 0.1F, &physicsConfig) != 1 ||
        !(body.position[1] < 10.0F)) {
        std::cerr << "[FAIL] Physics integration" << std::endl;
        return 1;
    }
    std::cout << "[PASS] Physics integration" << std::endl;
    std::cout << "All native self-tests passed." << std::endl;
    return 0;
}

int runServer(std::uint16_t port) {
    NativeNetworkManager network;
    if (!network.startServer(port)) {
        return 1;
    }

    GameState state;
    PacketProcessor processor(state);

    std::signal(SIGINT, handleSignal);
    std::signal(SIGTERM, handleSignal);

    std::cout << "Verlex server ready. Press Ctrl+C to stop." << std::endl;
    while (serverRunning) {
        Packet packet;
        sockaddr_in sender{};
        if (!network.receivePacket(packet, &sender, 250)) {
            continue;
        }

        if (!processor.processPacket(packet)) {
            std::cerr << "Verlex: rejected malformed or invalid packet." << std::endl;
            continue;
        }

        if (packet.header.type == PacketType::PING) {
            network.sendPacket(packet, sender);
        }
    }

    std::cout << "Verlex server stopped. Players tracked: "
              << state.playerCount() << std::endl;
    return 0;
}

void printUsage(const char* executable) {
    std::cout << "Verlex Full native runtime\n"
              << "Usage:\n"
              << "  " << executable << " --self-test\n"
              << "  " << executable << " --server [port]\n"
              << "\nDefault server port: 27015\n";
}
} // namespace

int main(int argc, char** argv) {
    initializeEngine();

    if (argc >= 2 && std::string(argv[1]) == "--self-test") {
        return runSelfTest();
    }

    if (argc >= 2 && std::string(argv[1]) == "--server") {
        std::uint16_t port = 27015;
        if (argc >= 3 && !parsePort(argv[2], port)) {
            std::cerr << "Invalid port. Choose a value from 1 to 65535."
                      << std::endl;
            return 2;
        }
        if (argc > 3) {
            printUsage(argv[0]);
            return 2;
        }
        return runServer(port);
    }

    printUsage(argv[0]);
    return argc == 1 ? 0 : 2;
}
