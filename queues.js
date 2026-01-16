const QUEUE_PARAMS = {
  
  normal: {   
    readable_name: "Cascade Lake Normal Queue",
    rate: 2.0, cores: 48, mem: 192, disk: 400, walltime: 48, core_fp64: 0.05,
    maxNodes: 432, // 20736 cores / 48
    ncpuLimits: [
      { max: 672, walltime: 48 },
      { max: 1440, walltime: 24 },
      { max: 2976, walltime: 10 },
      { max: 20736, walltime: 5 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "c5.24xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/c5.24xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 7.7
        }
  },
  
  express: {    
    readable_name: "Cascade Lake Express Queue",
    rate: 6.0, cores: 48, mem: 192, disk: 400, walltime: 24, core_fp64: 0.05,
    maxNodes: 66, // 3168 cores / 48
    ncpuLimits: [
      { max: 480, walltime: 24 },
      { max: 3168, walltime: 5 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "c5.24xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/c5.24xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 2.6
        }
  },
  
  hugemem: {    
    readable_name: "Cascade Lake Huge Memory Queue",
    rate: 3.0, cores: 48, mem: 1472, disk: 1400, walltime: 48, core_fp64: 0.05,
    maxNodes: 4,
    ncpuLimits: [
      { max: 48, walltime: 48 },
      { max: 96, walltime: 24 },
      { max: 192, walltime: 5 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "x8g.24xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/x8g.24xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 10.8
        }
  },
  
  megamem: { 
    readable_name: "Cascade Lake Mega Memory Queue",
    rate: 5.0, cores: 48, mem: 2992, disk: 1400, walltime: 48, core_fp64: 0.05,
    maxNodes: 2,
    ncpuLimits: [
      { max: 48, walltime: 48 },
      { max: 96, walltime: 24 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "x2iedn.24xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/x2iedn.24xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 16.7
        }
  },

  normalbw: { 
    readable_name: "Broadwell Normal Queue",
    rate: 1.25, cores: 28, mem: 128, disk: 400, walltime: 48, core_fp64: 0.05,
    maxNodes: 360, // 10080 cores / 28
    ncpuLimits: [
      { max: 336, walltime: 48 },
      { max: 840, walltime: 24 },
      { max: 1736, walltime: 10 },
      { max: 10080, walltime: 5 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "c6g.16xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/c6g.16xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 11.2
        }
  },
  
  expressbw: {  
    readable_name: "Broadwell Express Queue",
    rate: 3.75, cores: 28, mem: 128, disk: 400, walltime: 24, core_fp64: 0.05,
    maxNodes: 66, // 1848 cores / 28
    ncpuLimits: [
      { max: 280, walltime: 24 },
      { max: 1848, walltime: 5 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "c6g.16xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/c6g.16xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 3.7
        }
  },
  
  hugemembw: { 
    readable_name: "Broadwell Huge Memory Queue",
    rate: 1.25, cores: 28, mem: 1020, disk: 390, walltime: 48, core_fp64: 0.05,
    maxNodes: 5,
    ncpuLimits: [
      { max: 28, walltime: 48 },
      { max: 140, walltime: 12 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "x8g.16xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/x8g.16xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 29.7
        }
  },
  
  megamembw: { 
    readable_name: "Broadwell Mega Memory Queue",
    rate: 1.25, cores: 64, mem: 3000, disk: 800, walltime: 48, core_fp64: 0.05,
    maxNodes: 1,
    ncpuLimits: [
      { max: 32, walltime: 48 },
      { max: 64, walltime: 12 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "x8g.48xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/x8g.48xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 39.0
        }
  },

  normalsl: { 
    readable_name: "Skylake Normal Queue",
    rate: 1.5, cores: 32, mem: 192, disk: 400, walltime: 48, core_fp64: 0.05,
    maxNodes: 100, // 3200 cores / 32
    ncpuLimits: [
      { max: 288, walltime: 48 },
      { max: 608, walltime: 24 },
      { max: 1984, walltime: 10 },
      { max: 3200, walltime: 5 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "m6g.16xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/m6g.16xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 8.9
        }
  },
  
  normalsr: { 
    readable_name: "Sapphire Rapids Normal Queue",
    rate: 2.0, cores: 104, mem: 512, disk: 400, walltime: 48, core_fp64: 0.05,
    maxNodes: 100, // 10400 cores / 104
    ncpuLimits: [
      { max: 1040, walltime: 48 },
      { max: 2080, walltime: 24 },
      { max: 4160, walltime: 10 },
      { max: 10400, walltime: 5 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "m6a.48xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/m6a.48xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 6.9
        }
  },
  
  expresssr: { 
    readable_name: "Sapphire Rapids Express Queue",
    rate: 6.0, cores: 104, mem: 512, disk: 400, walltime: 24, core_fp64: 0.05,
    maxNodes: 20, // 2080 cores / 104
    ncpuLimits: [
      { max: 1040, walltime: 24 },
      { max: 2080, walltime: 5 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "m6a.48xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/m6a.48xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 2.3
        }
  },

  gpuvolta: { 
    readable_name: "NVIDIA DGX V100 Queue",
    rate: 3.0, cores: 48, mem: 384, disk: 400, walltime: 48, gpus: 4, gpuram: 128, core_fp64: 0.05, gpu_fp64: 7,
    maxNodes: 20, // 960 cores / 48
    ncpuLimits: [
      { max: 96, walltime: 48 },
      { max: 192, walltime: 24 },
      { max: 960, walltime: 5 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "p3.8xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/p3.8xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 23.5
        }
  },
  
  dgxa100: { 
    readable_name: "NVIDIA DGX A100 Queue",
    rate: 4.5, cores: 128, mem: 2000, disk: 28000, walltime: 48, gpus: 8, gpuram: 640, core_fp64: 0.05, gpu_fp64: 9.7,
    maxNodes: 2, // 256 cores / 128
    ncpuLimits: [
      { max: 128, walltime: 48 },
      { max: 256, walltime: 5 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "p4d.24xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/p4d.24xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 6.9
        }
  },
  
  gpuhopper: { 
    readable_name: "NVIDIA Hopper (H200) Queue",
    rate: 7.5, cores: 48, mem: 1000, disk: 1700, walltime: 48, gpus: 4, gpuram: 564, core_fp64: 0.05, gpu_fp64: 34,
    maxNodes: 1,
    ncpuLimits: [
      { max: 48, walltime: 48 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "p5.48xlarge",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/p5.48xlarge?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 13.8
        }
  },

  copyq: { 
    readable_name: "Copy Queue",
    rate: 2.0, cores: 1, mem: 190, disk: 200, walltime: 10,
    maxNodes: 1,
    ncpuLimits: [
      { max: 1, walltime: 10 }
    ],
    cloud_alternative: {
        provider: "AWS", 
        instance: "c5a.large",
        region: "ap-southeast-2",
        pricing_link:"https://instances.vantage.sh/aws/ec2/c5a.large?currency=AUD&region=ap-southeast-2",
        on_demand_price_multiple: 7.2
        }
  }
};
