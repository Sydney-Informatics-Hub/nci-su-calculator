const QUEUE_PARAMS = {
  normal: { 
    rate: 2.0, cores: 48, mem: 192, disk: 400, walltime: 48, core_fp64: 0.05,
    maxNodes: 432, // 20736 cores / 48
    ncpuLimits: [
      { max: 672, walltime: 48 },
      { max: 1440, walltime: 24 },
      { max: 2976, walltime: 10 },
      { max: 20736, walltime: 5 }
    ]
  },
  express: { 
    rate: 6.0, cores: 48, mem: 192, disk: 400, walltime: 24, core_fp64: 0.05,
    maxNodes: 66, // 3168 cores / 48
    ncpuLimits: [
      { max: 480, walltime: 24 },
      { max: 3168, walltime: 5 }
    ]
  },
  hugemem: { 
    rate: 3.0, cores: 48, mem: 3072, disk: 1400, walltime: 48, core_fp64: 0.05,
    maxNodes: 4,
    ncpuLimits: [
      { max: 48, walltime: 48 },
      { max: 96, walltime: 24 },
      { max: 192, walltime: 5 }
    ]
  },
  megamem: { 
    rate: 5.0, cores: 48, mem: 6144, disk: 1400, walltime: 48, core_fp64: 0.05,
    maxNodes: 2,
    ncpuLimits: [
      { max: 48, walltime: 48 },
      { max: 96, walltime: 24 }
    ]
  },

  normalbw: { 
    rate: 1.25, cores: 28, mem: 128, disk: 400, walltime: 48, core_fp64: 0.05,
    maxNodes: 360, // 10080 cores / 28
    ncpuLimits: [
      { max: 336, walltime: 48 },
      { max: 840, walltime: 24 },
      { max: 1736, walltime: 10 },
      { max: 10080, walltime: 5 }
    ]
  },
  expressbw: { 
    rate: 3.75, cores: 28, mem: 128, disk: 400, walltime: 24, core_fp64: 0.05,
    maxNodes: 66, // 1848 cores / 28
    ncpuLimits: [
      { max: 280, walltime: 24 },
      { max: 1848, walltime: 5 }
    ]
  },
  hugemembw: { 
    rate: 1.25, cores: 28, mem: 1020, disk: 390, walltime: 48, core_fp64: 0.05,
    maxNodes: 5,
    ncpuLimits: [
      { max: 28, walltime: 48 },
      { max: 140, walltime: 12 }
    ]
  },
  megamembw: { 
    rate: 1.25, cores: 64, mem: 3000, disk: 800, walltime: 48, core_fp64: 0.05,
    maxNodes: 1,
    ncpuLimits: [
      { max: 32, walltime: 48 },
      { max: 64, walltime: 12 }
    ]
  },

  normalsl: { 
    rate: 1.5, cores: 32, mem: 192, disk: 400, walltime: 48, core_fp64: 0.05,
    maxNodes: 100, // 3200 cores / 32
    ncpuLimits: [
      { max: 288, walltime: 48 },
      { max: 608, walltime: 24 },
      { max: 1984, walltime: 10 },
      { max: 3200, walltime: 5 }
    ]
  },
  normalsr: { 
    rate: 2.0, cores: 104, mem: 512, disk: 400, walltime: 48, core_fp64: 0.05,
    maxNodes: 100, // 10400 cores / 104
    ncpuLimits: [
      { max: 1040, walltime: 48 },
      { max: 2080, walltime: 24 },
      { max: 4160, walltime: 10 },
      { max: 10400, walltime: 5 }
    ]
  },
  expresssr: { 
    rate: 6.0, cores: 104, mem: 512, disk: 400, walltime: 24, core_fp64: 0.05,
    maxNodes: 20, // 2080 cores / 104
    ncpuLimits: [
      { max: 1040, walltime: 24 },
      { max: 2080, walltime: 5 }
    ]
  },

  gpuvolta: { 
    rate: 3.0, cores: 48, mem: 384, disk: 400, walltime: 48, gpus: 4, gpuram: 128, core_fp64: 0.05, gpu_fp64: 7,
    maxNodes: 20, // 960 cores / 48
    ncpuLimits: [
      { max: 96, walltime: 48 },
      { max: 192, walltime: 24 },
      { max: 960, walltime: 5 }
    ]
  },
  dgxa100: { 
    rate: 4.5, cores: 128, mem: 2000, disk: 28000, walltime: 48, gpus: 8, gpuram: 640, core_fp64: 0.05, gpu_fp64: 9.7,
    maxNodes: 2, // 256 cores / 128
    ncpuLimits: [
      { max: 128, walltime: 48 },
      { max: 256, walltime: 5 }
    ]
  },
  gpuhopper: { 
    rate: 7.5, cores: 48, mem: 1000, disk: 1700, walltime: 48, gpus: 4, gpuram: 564, core_fp64: 0.05, gpu_fp64: 34,
    maxNodes: 1,
    ncpuLimits: [
      { max: 48, walltime: 48 }
    ]
  },

  copyq: { 
    rate: 2.0, cores: 1, mem: 190, disk: 200, walltime: 10,
    maxNodes: 1,
    ncpuLimits: [
      { max: 1, walltime: 10 }
    ]
  }
};
