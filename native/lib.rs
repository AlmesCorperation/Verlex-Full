//! Optional Rust validation module used by the native packet processor.

/// Returns 1 when a player position is finite and within the engine's
/// broad-world coordinate limit; otherwise returns 0.
#[no_mangle]
pub extern "C" fn verlex_rust_position_is_valid(x: f32, y: f32, z: f32) -> u8 {
    const WORLD_LIMIT: f32 = 1_000_000.0;

    if x.is_finite()
        && y.is_finite()
        && z.is_finite()
        && x.abs() <= WORLD_LIMIT
        && y.abs() <= WORLD_LIMIT
        && z.abs() <= WORLD_LIMIT
    {
        1
    } else {
        0
    }
}
