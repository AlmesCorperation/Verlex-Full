#ifndef VERLEX_PHYSICS_H
#define VERLEX_PHYSICS_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct VerlexPhysicsBody {
    float position[3];
    float velocity[3];
    uint8_t is_static;
} VerlexPhysicsBody;

typedef struct VerlexPhysicsConfig {
    float gravity[3];
    float max_delta_time;
} VerlexPhysicsConfig;

// Advances dynamic bodies using semi-implicit Euler integration.
// Returns the number of bodies that were advanced.
size_t verlex_physics_step(VerlexPhysicsBody* bodies,
                           size_t body_count,
                           float delta_time,
                           const VerlexPhysicsConfig* config);

#ifdef __cplusplus
}
#endif

#endif
