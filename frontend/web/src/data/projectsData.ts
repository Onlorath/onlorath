import { ProjectArchitecture } from '../types';

export const PROJECTS_DATA: ProjectArchitecture[] = [
  {
    id: 'stream-core',
    title: 'AetherFlux: High-Throughput Stream Engine',
    codename: 'PROJ_AETHER_V2',
    category: 'Distributed Systems',
    shortDesc: 'Sub-millisecond event streaming and lock-free ring buffer processing in Go.',
    fullDesc:
      'Engineered an enterprise event streaming pipeline capable of ingesting 1.2M events/sec per node. Replaced standard channel-based queues with zero-allocation LMAX Disruptor-style ring buffers and SIMD-accelerated serialization.',
    complexity: {
      time: 'O(1) amortized enqueue/dequeue',
      space: 'O(N) fixed pre-allocated memory pool',
      throughput: '1.2M ops/sec per worker node',
      latency: 'P99 < 350 microseconds',
    },
    architecturalDecisions: [
      'Hexagonal Architecture isolating domain logic from Kafka/TCP socket drivers.',
      'Raw byte pool reuse using sync.Pool to eliminate GC pauses under peak loads.',
      'Atomic memory barriers replacing traditional mutex locks for concurrent consumers.',
    ],
    tradeOffs: {
      planA: 'Standard Go channels with goroutine worker pools (easy to write, high GC pressure).',
      planB: 'Lock-free sequential ring buffer with cache-line padded atomics (zero allocations, 4.8x higher throughput).',
      rationale: 'Under high ingest volume, Go GC pauses cause unacceptable P99 latency spikes. Zero-allocation ring buffers guarantee deterministic latency.',
    },
    techStack: ['Go', 'Kafka', 'Raw TCP', 'Docker', 'Linux epoll', 'Prometheus'],
    githubUrl: 'https://github.com/example/aetherflux-engine',
    liveUrl: 'https://demo.aetherflux.internal',
    status: 'PRODUCTION',
    stats: [
      { label: 'Peak Throughput', value: '1.2M req/s' },
      { label: 'P99 Latency', value: '0.35 ms' },
      { label: 'GC Pause Time', value: '0.00 ms' },
    ],
  },
  {
    id: 'neural-mesh',
    title: 'CogniMesh: Autonomous AI Agent Orchestrator',
    codename: 'PROJ_COGNI_AI',
    category: 'AI & Inference',
    shortDesc: 'DAG-based multi-agent execution runtime with vector memory and speculative execution.',
    fullDesc:
      'Architected a distributed agent orchestrator that coordinates specialized LLM microservices. Features streaming token state-machines, asynchronous vector retrieval with HNSW indexing, and speculative agent branch execution.',
    complexity: {
      time: 'O(V + E) DAG resolution + O(log N) vector search',
      space: 'O(K) token buffer + context cache window',
      throughput: '450 concurrent multi-step agent graphs',
      latency: 'Time-To-First-Token < 45ms',
    },
    architecturalDecisions: [
      'Topological sort DAG engine with parallel branch evaluation.',
      'Reverse-proxy gRPC gateway streaming tokens via Server-Sent Events (SSE).',
      'Local tensor cache using memory-mapped embeddings for fast warm restarts.',
    ],
    tradeOffs: {
      planA: 'Sequential REST chaining between agent nodes (high latency, cascading timeouts).',
      planB: 'Event-driven speculative DAG evaluator over gRPC with streaming backpressure.',
      rationale: 'Speculative branching executes plausible next-step agents concurrently, reducing end-to-end task completion time by 62%.',
    },
    techStack: ['Python', 'PyTorch', 'gRPC', 'FastAPI', 'Qdrant', 'Redis', 'Docker'],
    githubUrl: 'https://github.com/example/cognimesh-orchestrator',
    liveUrl: 'https://demo.cognimesh.internal',
    status: 'BENCHMARKED',
    stats: [
      { label: 'TTFT', value: '42 ms' },
      { label: 'DAG Concurrency', value: '450 flows' },
      { label: 'Context Efficiency', value: '94.2%' },
    ],
  },
  {
    id: 'shader-telemetry',
    title: 'NeonVoid: Real-Time WebGL Telemetry Engine',
    codename: 'PROJ_NEON_VOID',
    category: 'WebGL & Graphics',
    shortDesc: 'GPU-instanced compute visualizer rendering 100,000+ real-time telemetry metrics at 120 FPS.',
    fullDesc:
      'Developed a zero-copy WebGL visualization engine using custom GLSL shaders and InstancedBufferGeometry. Streams telemetry telemetry from distributed nodes directly into GPU textures for immediate visual analysis without CPU serialization.',
    complexity: {
      time: 'O(1) GPU vertex pipeline compute',
      space: 'O(1) CPU main thread memory overhead',
      throughput: '120 FPS rock-solid on 4K display',
      latency: 'Render pipeline frame budget < 4.2ms',
    },
    architecturalDecisions: [
      'Pre-allocated ArrayBuffers; zero object allocations inside requestAnimationFrame / useFrame.',
      'Custom fragment shaders for volumetric space glow and glow bloom without post-processing blur penalties.',
      'Web Workers for binary WebSocket telemetry decoding off the UI thread.',
    ],
    tradeOffs: {
      planA: 'DOM/SVG canvas rendering or basic Three.js Mesh per point (bottlenecks at 5,000 nodes).',
      planB: 'InstancedBufferGeometry with custom GLSL shaders and GPU floating-point texture data (100k+ nodes).',
      rationale: 'GPU-instanced rendering delegates point positioning and color modulation entirely to the GPU vertex stage, keeping CPU utilization under 4%.',
    },
    techStack: ['TypeScript', 'WebGL', 'Three.js', 'GLSL', 'Web Workers', 'WebSockets'],
    githubUrl: 'https://github.com/example/neonvoid-telemetry',
    liveUrl: 'https://demo.neonvoid.internal',
    status: 'PRODUCTION',
    stats: [
      { label: 'Particle Count', value: '100,000+' },
      { label: 'Framerate', value: '120 FPS' },
      { label: 'CPU Usage', value: '< 4%' },
    ],
  },
  {
    id: 'order-matching',
    title: 'ChronosMatch: Sub-50µs Order Matching Core',
    codename: 'PROJ_CHRONOS_GO',
    category: 'Core Infrastructure',
    shortDesc: 'Deterministic matching engine with raw SQL persistence and zero-allocation price-time priority.',
    fullDesc:
      'Built a high-frequency order matching engine adhering to strict Hexagonal Architecture in Go. Features double-ended price limit priority trees, snapshot checkpointing, and raw SQL transaction logging with zero ORM overhead.',
    complexity: {
      time: 'O(1) best bid/ask lookup + O(1) order cancellation via hash indexing',
      space: 'O(M) active order book memory footprint',
      throughput: '850,000 matches / second',
      latency: 'Mean match latency 18 microseconds',
    },
    architecturalDecisions: [
      'No ORMs (raw database/sql and prepared statements) for zero-overhead persistence.',
      'Strict separation: Domain Model -> Port Interfaces -> Database / Wire Adapters.',
      'Single-threaded matching loop pinned to dedicated CPU core to eliminate lock contention.',
    ],
    tradeOffs: {
      planA: 'Database-driven transactional matching with GORM (max 8,000 matches/sec, high DB locking).',
      planB: 'In-memory deterministic order book with async raw SQL WAL (Write-Ahead Logging) (850,000 matches/sec).',
      rationale: 'Decoupling in-memory state transition from asynchronous batch WAL guarantees sub-50µs SLA while maintaining crash resilience.',
    },
    techStack: ['Go', 'Raw SQL', 'PostgreSQL', 'Hexagonal Architecture', 'Linux cgroups'],
    githubUrl: 'https://github.com/example/chronos-engine',
    liveUrl: 'https://demo.chronos.internal',
    status: 'PRODUCTION',
    stats: [
      { label: 'Avg Latency', value: '18 µs' },
      { label: 'Match Rate', value: '850k /s' },
      { label: 'Zero ORM', value: '100% Raw SQL' },
    ],
  },
];
