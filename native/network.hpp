#ifndef VERLEX_NETWORK_HPP
#define VERLEX_NETWORK_HPP

#include <iostream>
#include <string>

class NativeNetworkManager {
public:
    NativeNetworkManager();
    ~NativeNetworkManager();
    
    bool startServer(int port);
    void sendData(const std::string& data);
    
private:
    int sockfd;
};

#endif
