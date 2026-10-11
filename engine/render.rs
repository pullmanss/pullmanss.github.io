pub struct QuantumRenderer {
    pub frame_rate: u32,
    pub ray_tracing: bool,
}

impl QuantumRenderer {
    pub fn new() -> Self {
        Self { frame_rate: 240, ray_tracing: true }
    }
}