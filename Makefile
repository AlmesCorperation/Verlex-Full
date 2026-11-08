# Verlex Full — native runtime build
CXX ?= g++
CC ?= gcc
RUSTC ?= rustc

BUILD_DIR ?= build
TARGET := $(BUILD_DIR)/verlex_native

CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra -Wpedantic
CFLAGS ?= -std=c11 -O2 -Wall -Wextra -Wpedantic
CPPFLAGS += -Inative
LDFLAGS ?=
LDLIBS ?=

WITH_RUST ?= 0

CPP_OBJECTS := \
	$(BUILD_DIR)/main.o \
	$(BUILD_DIR)/engine.o \
	$(BUILD_DIR)/network.o \
	$(BUILD_DIR)/PacketProcessor.o
C_OBJECTS := $(BUILD_DIR)/physics.o
OBJECTS := $(CPP_OBJECTS) $(C_OBJECTS)

ifeq ($(WITH_RUST),1)
CPPFLAGS += -DVERLEX_WITH_RUST
RUST_LIBRARY := $(BUILD_DIR)/libverlex_rust.a
RUST_LINK := $(RUST_LIBRARY) -ldl -lpthread -lm -lrt -lutil
else
RUST_LINK :=
endif

.PHONY: all clean run test rust
all: $(TARGET)

$(TARGET): $(OBJECTS) $(RUST_LIBRARY)
	$(CXX) $(LDFLAGS) -o $@ $(OBJECTS) $(RUST_LINK) $(LDLIBS)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(BUILD_DIR)/main.o: native/main.cpp native/engine.hpp native/network.hpp native/PacketProcessor.hpp native/physics.h | $(BUILD_DIR)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -MMD -MP -c $< -o $@

$(BUILD_DIR)/engine.o: native/engine.cpp native/engine.hpp | $(BUILD_DIR)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -MMD -MP -c $< -o $@

$(BUILD_DIR)/network.o: native/network.cpp native/network.hpp native/packet.hpp | $(BUILD_DIR)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -MMD -MP -c $< -o $@

$(BUILD_DIR)/PacketProcessor.o: native/PacketProcessor.cpp native/PacketProcessor.hpp native/GameState.hpp native/packet.hpp | $(BUILD_DIR)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -MMD -MP -c $< -o $@

$(BUILD_DIR)/physics.o: native/physics.c native/physics.h | $(BUILD_DIR)
	$(CC) $(CFLAGS) -MMD -MP -c $< -o $@

$(RUST_LIBRARY): native/lib.rs | $(BUILD_DIR)
	$(RUSTC) --edition=2021 --crate-name verlex_rust --crate-type staticlib $< -o $@

rust: $(RUST_LIBRARY)

run: $(TARGET)
	./$(TARGET) --server

test: $(TARGET)
	./$(TARGET) --self-test

clean:
	rm -rf $(BUILD_DIR)

-include $(OBJECTS:.o=.d)
