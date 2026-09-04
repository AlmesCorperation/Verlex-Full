#include "network.hpp"
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>

NativeNetworkManager::NativeNetworkManager() : sockfd(-1) {}

NativeNetworkManager::~NativeNetworkManager() {
    if (sockfd != -1) close(sockfd);
}

bool NativeNetworkManager::startServer(int port) {
    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0) return false;

    struct sockaddr_in servaddr;
    memset(&servaddr, 0, sizeof(servaddr));
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = INADDR_ANY;
    servaddr.sin_port = htons(port);

    if (bind(sockfd, (const struct sockaddr *)&servaddr, sizeof(servaddr)) < 0) {
        return false;
    }

    std::cout << "Native RTC (UDP) Server started on port " << port << std::endl;
    return true;
}

void NativeNetworkManager::sendData(const std::string& data) {
    // Basic implementation for native RTC data transmission
    std::cout << "Sending raw packet: " << data << std::endl;
}
