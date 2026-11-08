#include "network.hpp"

#include <cerrno>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <poll.h>
#include <sys/socket.h>
#include <unistd.h>
#include <vector>

NativeNetworkManager::NativeNetworkManager() : sockfd(-1) {}

NativeNetworkManager::~NativeNetworkManager() {
    if (sockfd >= 0) {
        close(sockfd);
    }
}

bool NativeNetworkManager::startServer(std::uint16_t port) {
    if (sockfd >= 0) {
        close(sockfd);
        sockfd = -1;
    }

    const int newSocket = socket(AF_INET, SOCK_DGRAM, 0);
    if (newSocket < 0) {
        std::cerr << "Verlex: socket() failed: " << std::strerror(errno) << std::endl;
        return false;
    }

    int reuseAddress = 1;
    (void)setsockopt(newSocket, SOL_SOCKET, SO_REUSEADDR,
                     &reuseAddress, sizeof(reuseAddress));

    sockaddr_in serverAddress{};
    serverAddress.sin_family = AF_INET;
    serverAddress.sin_addr.s_addr = htonl(INADDR_ANY);
    serverAddress.sin_port = htons(port);

    if (bind(newSocket, reinterpret_cast<const sockaddr*>(&serverAddress),
             sizeof(serverAddress)) < 0) {
        std::cerr << "Verlex: bind() failed on port " << port << ": "
                  << std::strerror(errno) << std::endl;
        close(newSocket);
        return false;
    }

    sockfd = newSocket;

    sockaddr_in actualAddress{};
    socklen_t addressLength = sizeof(actualAddress);
    if (getsockname(sockfd, reinterpret_cast<sockaddr*>(&actualAddress),
                    &addressLength) == 0) {
        std::cout << "Verlex UDP server listening on port "
                  << ntohs(actualAddress.sin_port) << std::endl;
    }
    return true;
}

bool NativeNetworkManager::receivePacket(Packet& packet, sockaddr_in* sender,
                                         int timeoutMilliseconds) const {
    if (sockfd < 0) {
        return false;
    }

    pollfd descriptor{};
    descriptor.fd = sockfd;
    descriptor.events = POLLIN;

    int pollResult;
    do {
        pollResult = poll(&descriptor, 1, timeoutMilliseconds);
    } while (pollResult < 0 && errno == EINTR);

    if (pollResult <= 0 || (descriptor.revents & POLLIN) == 0) {
        return false;
    }

    std::uint8_t buffer[VERLEX_PACKET_MAX_SIZE + 1]{};
    sockaddr_in sourceAddress{};
    socklen_t sourceLength = sizeof(sourceAddress);
    const ssize_t received = recvfrom(
        sockfd, buffer, sizeof(buffer), 0,
        reinterpret_cast<sockaddr*>(&sourceAddress), &sourceLength);

    if (received <= 0 ||
        !decodePacket(buffer, static_cast<std::size_t>(received), packet)) {
        return false;
    }

    if (sender != nullptr) {
        *sender = sourceAddress;
    }
    return true;
}

bool NativeNetworkManager::sendPacket(const Packet& packet,
                                      const sockaddr_in& destination) const {
    if (sockfd < 0) {
        return false;
    }

    std::vector<std::uint8_t> bytes;
    if (!encodePacket(packet, bytes)) {
        return false;
    }

    const ssize_t sent = sendto(
        sockfd, bytes.data(), bytes.size(), 0,
        reinterpret_cast<const sockaddr*>(&destination), sizeof(destination));
    return sent == static_cast<ssize_t>(bytes.size());
}

bool NativeNetworkManager::isRunning() const {
    return sockfd >= 0;
}
