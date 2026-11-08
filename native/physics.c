#include "physics.h"

#include <math.h>

size_t verlex_physics_step(VerlexPhysicsBody* bodies,
                           size_t body_count,
                           float delta_time,
                           const VerlexPhysicsConfig* config) {
    if (bodies == NULL || body_count == 0 ||
        !isfinite(delta_time) || delta_time <= 0.0f) {
        return 0;
    }

    const float default_gravity[3] = {0.0f, -9.81f, 0.0f};
    const float* gravity = default_gravity;
    float max_delta_time = 0.05f;

    if (config != NULL) {
        gravity = config->gravity;
        if (isfinite(config->max_delta_time) && config->max_delta_time > 0.0f) {
            max_delta_time = config->max_delta_time;
        }
    }

    if (!isfinite(gravity[0]) || !isfinite(gravity[1]) ||
        !isfinite(gravity[2])) {
        gravity = default_gravity;
    }

    if (delta_time > max_delta_time) {
        delta_time = max_delta_time;
    }

    size_t advanced = 0;
    for (size_t i = 0; i < body_count; ++i) {
        VerlexPhysicsBody* body = &bodies[i];
        if (body->is_static) {
            continue;
        }

        int valid = 1;
        for (size_t axis = 0; axis < 3; ++axis) {
            if (!isfinite(body->position[axis]) ||
                !isfinite(body->velocity[axis])) {
                valid = 0;
                break;
            }
        }
        if (!valid) {
            continue;
        }

        for (size_t axis = 0; axis < 3; ++axis) {
            body->velocity[axis] += gravity[axis] * delta_time;
            body->position[axis] += body->velocity[axis] * delta_time;
        }
        ++advanced;
    }

    return advanced;
}
