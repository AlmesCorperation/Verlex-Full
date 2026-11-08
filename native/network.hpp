#ifndef VERLEX_NETWORK_HPP
#define VERLEX_NETWORK_HPP

#include "packet.hpp"

#include <cstdint>
#include <netinet/in.h>

class NativeNetworkManager {
public:
    NativeNetworkManager();
    ~NativeNetworkManager();

    NativeNetworkManager(const NativeNetworkManager&) = delete;
    NativeNetworkManager& operator=(const NativeNetworkManager&) = delete;

    bool startServer(std::uint16_t port);
    bool receivePacket(Packet& packet, sockaddr_in* sender = nullptr,
                       int timeoutMilliseconds = 250) const;
    bool sendPacket(const Packet& packet, const sockaddr_in& destination) const;
    bool isRunning() const;

private:
    int sockfd;
};

#endif
