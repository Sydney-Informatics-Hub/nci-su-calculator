const QUEUE_PARAMS = {
  normal: { rate: 2.0, cores: 48, mem: 192, disk: 400, walltime: 48 },
  express: { rate: 6.0, cores: 48, mem: 192, disk: 400, walltime: 24, },
  hugemem: { rate: 3.0, cores: 48, mem: 3072, disk: 1400, walltime: 48 },
  megamem: { rate: 5.0, cores: 48, mem: 6144, disk: 1400, walltime: 48 },

  normalbw: { rate: 1.25, cores: 28, mem: 128, disk: 400, walltime: 48 },
  expressbw: { rate: 3.75, cores: 28, mem: 128, disk: 400, walltime: 24 },
  hugemembw: { rate: 1.25, cores: 28, mem: 1020, disk: 390, walltime: 48 },
  megamembw: { rate: 1.25, cores: 64, mem: 3000, disk: 800, walltime: 48 },

  normalsl: { rate: 1.5, cores: 36, mem: 192, disk: 400, walltime: 48 },
  normalsr: { rate: 2.0, cores: 104, mem: 192, disk: 400, walltime: 48 },
  expresssr: { rate: 6.0, cores: 104, mem: 192, disk: 400, walltime: 24 },

  gpuvolta: { rate: 3.0, cores: 48, mem: 384, disk: 400, walltime: 48, gpus: 4, gpuram: 160},
  dgxa100: { rate: 4.5, cores: 128, mem: 2000, disk: 28000, walltime: 48, gpus: 8, gpuram:  640},
  gpuhopper: { rate: 7.5, cores: 48, mem: 1000, disk: 400, walltime: 48, gpus: 4, gpuram: 564},

  copyq: { rate: 2.0, cores: 1, mem: 190, disk: 200, walltime: 10}
};