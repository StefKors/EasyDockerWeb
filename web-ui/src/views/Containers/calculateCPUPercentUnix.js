export function calculateCPUPercentUnix(json) {
  // Only run if we have preCPU stats
  if (json.precpu_stats.system_cpu_usage) {
    const previousCPU = json.precpu_stats.cpu_usage.total_usage;
    const previousSystem = json.precpu_stats.system_cpu_usage;
    let cpuPercent = 0.0;
    const cpuDelta = parseInt(json.cpu_stats.cpu_usage.total_usage) - parseInt(previousCPU);
    const systemDelta = parseInt(json.cpu_stats.system_cpu_usage) - parseInt(previousSystem);
    if (systemDelta > 0.0 && cpuDelta > 0.0) {
      cpuPercent = (cpuDelta / systemDelta) * parseInt(json.cpu_stats.cpu_usage.percpu_usage.length) * 100.0;
    }
    return Number(cpuPercent).toFixed(2);
  }
}
