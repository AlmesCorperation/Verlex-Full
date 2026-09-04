# Compiler settings
CXX = g++
CC = gcc
RUSTC = rustc

# Build output
BUILD_DIR = build
TARGET = $(BUILD_DIR)/verlex_native

# Source files
CPP_SRC = native/engine.cpp native/network.cpp
C_SRC = native/physics.c
RS_SRC = native/lib.rs

all: $(TARGET)

$(TARGET): $(BUILD_DIR)/engine.o $(BUILD_DIR)/physics.o $(BUILD_DIR)/network.o
	$(CXX) $(BUILD_DIR)/engine.o $(BUILD_DIR)/physics.o $(BUILD_DIR)/network.o -o $(TARGET)

$(BUILD_DIR)/engine.o: $(CPP_SRC)
	mkdir -p $(BUILD_DIR)
	$(CXX) -c native/engine.cpp -o $(BUILD_DIR)/engine.o

$(BUILD_DIR)/physics.o: $(C_SRC)
	mkdir -p $(BUILD_DIR)
	$(CC) -c $(C_SRC) -o $(BUILD_DIR)/physics.o

$(BUILD_DIR)/network.o: native/network.cpp native/network.hpp
	mkdir -p $(BUILD_DIR)
	$(CXX) -c native/network.cpp -o $(BUILD_DIR)/network.o

# Rust compilation (assuming rustc is installed)
rust: $(RS_SRC)
	mkdir -p $(BUILD_DIR)
	$(RUSTC) --crate-type staticlib $(RS_SRC) --out-dir $(BUILD_DIR)

# Add the Rust library path and name (assuming 'libverlex_rust.a' is produced by cargo)
RUST_LIB = build/libverlex_rust.a

$(TARGET): $(BUILD_DIR)/engine.o $(BUILD_DIR)/physics.o $(BUILD_DIR)/network.o $(BUILD_DIR)/PacketProcessor.o
	$(CXX) $(BUILD_DIR)/engine.o $(BUILD_DIR)/physics.o $(BUILD_DIR)/network.o $(BUILD_DIR)/PacketProcessor.o $(RUST_LIB) -o $(TARGET)

$(BUILD_DIR)/PacketProcessor.o: native/PacketProcessor.cpp native/PacketProcessor.hpp
	mkdir -p $(BUILD_DIR)
	$(CXX) -c native/PacketProcessor.cpp -o $(BUILD_DIR)/PacketProcessor.o
	
clean:
	rm -rf $(BUILD_DIR)
