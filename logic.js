const $ = id => document.getElementById(id);
let queue = null;

// Populate queue dropdown
for (const [name, params] of Object.entries(QUEUE_PARAMS)) {
    const option = document.createElement('option');
    option.value = name;
    let label = `${name}: ${params.cores} cores, ${params.mem}GB, ${params.walltime}hr`;
    if (params.gpus) label += `, ${params.gpus}gpu(${params.gpuram}GB)`;
    label += `, ${params.rate}SU/core, ${params.readable_name}`;
    option.textContent = label;
    $('queue').appendChild(option);
}

function update(source) {
    if (!queue) return;

    const isGpu = !!queue.gpus;
    
    // Read from inputs
    let cpus = parseInt($('cpus').value) || 1;
    let mem = parseInt($('mem').value) || 1;
    let gpus = isGpu ? parseInt($('gpus').value) || 1 : 0;
    let fairShare = parseFloat($('fair-share').value) / 100;
    
    // Enforce CPU maximum for the queue
    if (cpus > queue.cores && source === 'cpus') {
        cpus = queue.cores;
    }

    // Only recalculate if not loading from URL
    if (source !== 'url-load') {
        // If fair share slider moved, calculate resources from it
        if (source === 'fair-share') {
    	    if (isGpu) {
    	        gpus = Math.max(1, Math.ceil(fairShare * queue.gpus));
    	        const share = gpus / queue.gpus;
    	        cpus = Math.ceil(share * queue.cores);
    	        mem = Math.ceil(share * queue.mem);
    	    } else {
    	        cpus = Math.max(1, Math.ceil(fairShare * queue.cores));
    	        mem = Math.ceil(fairShare * queue.mem / 4) * 4;
    	    }
    	}
    }
    // If GPU input changed, calculate other GPU resources proportionally
    else if (source === 'gpus' && isGpu) {
        const share = gpus / queue.gpus;
        cpus = Math.ceil(share * queue.cores);
        mem = Math.ceil(share * queue.mem);
    }

    // Calculate fair share from resources
    const shares = [cpus / queue.cores, mem / queue.mem];
    if (isGpu) shares.push(gpus / queue.gpus);
    fairShare = Math.max(...shares);

    // Write to inputs
    $('cpus').value = cpus;
    $('mem').value = mem;
    $('fair-share').value = fairShare * 100;
    $('fair-share-display').textContent = (fairShare * 100).toFixed(1);
    
    if (isGpu) {
        $('gpus').value = gpus;
        $('gpuram').value = Math.ceil((gpus / queue.gpus) * queue.gpuram);
    }

    // Calculate single task costs
    const walltimeMinutes = parseInt($('walltime').value) || 60;
    const walltime = walltimeMinutes / 60;
    const effectiveCores = Math.ceil(fairShare * queue.cores);
    const suPerTask = effectiveCores * queue.rate * walltime;
    
    $('su-per-task').textContent = suPerTask.toFixed(2);
    
    const updateCosts = (su) => {
        // KSU cost on NCI
        $('total-su').textContent = su.toFixed(2);
        const ksu = su / 1000;
        const subsidised = ksu * 10.80;
        $('total-ksu').textContent = ksu.toFixed(2);
        $('subsidised-cost').textContent = subsidised.toFixed(2);
        
        // Cloud comparison (AWS)
        const cloud = queue?.cloud_alternative;
        if (cloud && typeof cloud.on_demand_price_multiple === 'number' && cloud.pricing_link) {
            const cloudCost = subsidised * cloud.on_demand_price_multiple;
        
            $('cloud-cost').textContent = cloudCost.toFixed(2);
            $('cloud-cost-multiple').textContent = cloud.on_demand_price_multiple.toFixed(0);
            $('cloud-cost-link').href = cloud.pricing_link;
        
            // If you later add other providers, you can optionally switch the link text here.
            // $('cloud-cost-link').textContent = `run this job on ${cloud.provider || 'AWS'}`;
        
            $('cloud-cost-row').style.display = 'block';
        } else {
            $('cloud-cost-row').style.display = 'none';
        }
    };
    
    const parallelEnabled = $('enable-parallel').checked;
    
    if (parallelEnabled) {
        calculateParallelJob(cpus, walltime, walltimeMinutes, suPerTask, updateCosts);
    } else {
        updateCosts(suPerTask);
        validateQueueLimits(cpus, 1, walltime, 1);
    }
    
    updateURL();
    updatePBSScript();
}

function calculateParallelJob(cpusPerTask, walltimeHours, walltimeMinutes, suPerTask, updateCosts) {
    const totalTasks = parseInt($('total-tasks').value) || 1;
    const tasksPerNode = Math.floor(queue.cores / cpusPerTask);
    
    if (tasksPerNode === 0) {
        ['tasks-per-node', 'nodes-recommended', 'tasks-concurrent', 'num-batches', 'total-walltime', 'total-cpus-parallel'].forEach(id => $(id).textContent = id === 'tasks-per-node' ? '0 (task too large!)' : 'N/A');
        $('parallel-recommendations').style.display = 'block';
        $('recommendations-content').innerHTML = `<p style="margin: 0;">⚠️ Each task requires ${cpusPerTask} CPUs, but nodes in the <strong>${$('queue').value}</strong> queue only have ${queue.cores} cores. You need to reduce CPUs per task or choose a queue with larger nodes.</p>`;
        return;
    }
    
    $('tasks-per-node').textContent = tasksPerNode;
    
    // Find optimal node count
    const recommendations = [];
    let idealNodes = Math.ceil(totalTasks / tasksPerNode);
    let recommendedNodes = idealNodes;
    let exceedsLimits = false;
    
    // Check against max nodes
    if (queue.maxNodes && idealNodes > queue.maxNodes) {
        recommendedNodes = queue.maxNodes;
        exceedsLimits = true;
        
        const idealConcurrent = tasksPerNode * idealNodes;
        const recommendedConcurrent = tasksPerNode * recommendedNodes;
        const recommendedBatches = Math.ceil(totalTasks / recommendedConcurrent);
        const recommendedTotalWalltime = recommendedBatches * walltimeHours;
        
        recommendations.push(`⚠️ Node Limit Exceeded: Running all ${totalTasks} tasks concurrently would require ${idealNodes} nodes, but the ${$('queue').value} queue has a maximum of ${queue.maxNodes} nodes per job.`);
        recommendations.push(`💡 Recommended Solution: Use the maximum ${recommendedNodes} nodes available. This will:`);
        recommendations.push(`   • Run ${recommendedConcurrent} tasks concurrently (${tasksPerNode} per node × ${recommendedNodes} nodes)`);
        recommendations.push(`   • Process all ${totalTasks} tasks in ${recommendedBatches} batch${recommendedBatches > 1 ? 'es' : ''}`);
        recommendations.push(`   • Require a total walltime of ${formatTime(recommendedTotalWalltime * 60)} (${walltimeMinutes} min/task × ${recommendedBatches} batches)`);
        recommendations.push(`   • Use ${recommendedNodes * Math.min(cpusPerTask * tasksPerNode, queue.cores)} total CPUs`);
    }
    
    // Calculate concurrent tasks with recommended nodes
    const tasksConcurrent = tasksPerNode * recommendedNodes;
    const numBatches = Math.ceil(totalTasks / tasksConcurrent);
    const totalWalltime = numBatches * walltimeHours;
    const totalCpus = Math.min(cpusPerTask * tasksPerNode, queue.cores) * recommendedNodes;
    
    // Check NCPU limits
    if (queue.ncpuLimits) {
        let maxWalltime = 0;
        for (const limit of queue.ncpuLimits) {
            if (totalCpus <= limit.max) {
                maxWalltime = limit.walltime;
                break;
            }
        }
        
        if (maxWalltime === 0) {
            const lastLimit = queue.ncpuLimits[queue.ncpuLimits.length - 1];
            exceedsLimits = true;
            
            // Find how many nodes would fit within NCPU limit
            const maxNodesForNCPU = Math.floor(lastLimit.max / Math.min(cpusPerTask * tasksPerNode, queue.cores));
            
            if (maxNodesForNCPU > 0) {
                const altConcurrent = tasksPerNode * maxNodesForNCPU;
                const altBatches = Math.ceil(totalTasks / altConcurrent);
                const altWalltime = altBatches * walltimeHours;
                
                recommendations.push(`⚠️ CPU Limit Exceeded: ${totalCpus} CPUs exceeds the maximum (${lastLimit.max}) for the ${$('queue').value} queue.`);
                recommendations.push(`💡 Recommended Solution: Reduce to ${maxNodesForNCPU} nodes. This will:`);
                recommendations.push(`   • Run ${altConcurrent} tasks concurrently`);
                recommendations.push(`   • Process all ${totalTasks} tasks in ${altBatches} batch${altBatches > 1 ? 'es' : ''}`);
                recommendations.push(`   • Require a total walltime of ${formatTime(altWalltime * 60)}`);
                recommendations.push(`   • Use ${maxNodesForNCPU * Math.min(cpusPerTask * tasksPerNode, queue.cores)} total CPUs (within limit)`);
                
                // Update recommended values to this constrained solution
                recommendedNodes = maxNodesForNCPU;
            } else {
                recommendations.push(`⚠️ CPU Limit Exceeded: Cannot fit this configuration in the ${$('queue').value} queue. Consider reducing CPUs per task or choosing a different queue.`);
            }
        } else if (totalWalltime > maxWalltime) {
            exceedsLimits = true;
            
            // Calculate minimum nodes needed to fit within walltime limit
            const minBatches = Math.ceil(totalWalltime / maxWalltime);
            const minConcurrent = Math.ceil(totalTasks / minBatches);
            const minNodes = Math.ceil(minConcurrent / tasksPerNode);
            
            if (minNodes <= (queue.maxNodes || Infinity)) {
                const newConcurrent = tasksPerNode * minNodes;
                const newBatches = Math.ceil(totalTasks / newConcurrent);
                const newWalltime = newBatches * walltimeHours;
                const newTotalCpus = Math.min(cpusPerTask * tasksPerNode, queue.cores) * minNodes;
                
                recommendations.push(`⚠️ Walltime Limit Exceeded: Total walltime of ${formatTime(totalWalltime * 60)} exceeds the maximum (${maxWalltime}h) for ${totalCpus} CPUs on the ${$('queue').value} queue.`);
                recommendations.push(`💡 Recommended Solution: Increase to ${minNodes} nodes to reduce batches. This will:`);
                recommendations.push(`   • Run ${newConcurrent} tasks concurrently`);
                recommendations.push(`   • Process all ${totalTasks} tasks in ${newBatches} batch${newBatches > 1 ? 'es' : ''}`);
                recommendations.push(`   • Require a total walltime of ${formatTime(newWalltime * 60)} (within ${maxWalltime}h limit)`);
                recommendations.push(`   • Use ${newTotalCpus} total CPUs`);
                
                // Update to recommended values
                recommendedNodes = minNodes;
            } else {
                recommendations.push(`⚠️ Walltime Limit Exceeded: Cannot fit within walltime limits for this queue. Consider reducing tasks, increasing walltime per task, or splitting into multiple jobs.`);
            }
        }
    }
    
    // Recalculate with final recommended nodes
    const finalConcurrent = tasksPerNode * recommendedNodes;
    const finalBatches = Math.ceil(totalTasks / finalConcurrent);
    const finalWalltime = finalBatches * walltimeHours;
    const finalTotalCpus = Math.min(cpusPerTask * tasksPerNode, queue.cores) * recommendedNodes;
    
    // Update displays
    $('tasks-per-node').textContent = tasksPerNode;
    $('nodes-recommended').textContent = recommendedNodes;
    $('tasks-concurrent').textContent = finalConcurrent;
    $('num-batches').textContent = finalBatches;
    $('total-walltime').textContent = formatTime(finalWalltime * 60);
    $('total-cpus-parallel').textContent = finalTotalCpus;
    
    // Calculate total SU
    updateCosts(suPerTask * totalTasks);
    
    // Show recommendations
    const pre = $('recommendations-content');
    const hasWarnings = recommendations.length > 0;
    
    if (!hasWarnings) {
        recommendations.push(`✅ Configuration Valid: Your job fits within all queue limits.`);
        recommendations.push(`   • ${finalConcurrent} tasks will run concurrently`);
        recommendations.push(`   • All ${totalTasks} tasks will complete in ${finalBatches} batch${finalBatches > 1 ? 'es' : ''}`);
        recommendations.push(`   • Total walltime: ${formatTime(finalWalltime * 60)}`);
    }
    
    $('parallel-recommendations').style.display = 'block';
    pre.textContent = recommendations.join('\n\n');
    pre.style.backgroundColor = hasWarnings ? '#fff3cd' : '#d4edda';
    pre.style.borderLeft = hasWarnings ? '4px solid #ffc107' : '4px solid #28a745';
    pre.style.color = hasWarnings ? '#856404' : '#155724';
    
    // Validate with recommendations
    validateQueueLimits(cpusPerTask, recommendedNodes, finalWalltime, tasksPerNode);
}

function formatTime(minutes) {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${Math.round(minutes)}m`;
}

function validateQueueLimits(cpusPerNode, nodes, totalWalltime, tasksPerNode) {
    const warnings = [];
    const totalCpus = cpusPerNode * nodes;
    const walltimeMinutes = parseInt($('walltime').value) || 60;
    const walltimeHours = walltimeMinutes / 60;
    
    // Only validate if not in parallel mode or if there are actual issues
    const parallelEnabled = $('enable-parallel').checked;
    if (parallelEnabled) {
        // Parallel mode handles its own recommendations
        $('warnings-container').style.display = 'none';
        return;
    }
    
    // Check if walltime exceeds queue maximum
    if (walltimeHours > queue.walltime) {
        warnings.push(`Walltime exceeded: Requesting ${formatTime(walltimeMinutes)}, but the ${$('queue').value} queue has a maximum walltime of ${queue.walltime} hours.`);
    }
    
    // Check node limit (single task mode)
    if (queue.maxNodes && nodes > queue.maxNodes) {
        warnings.push(`Nodes exceeded: Requesting ${nodes} nodes, but the ${$('queue').value} queue has a maximum of ${queue.maxNodes} nodes per job.`);
    }
    
    // Check NCPU limits with walltime restrictions (single task mode)
    if (queue.ncpuLimits) {
        let maxAllowed = 0;
        let maxWalltime = 0;
        
        for (const limit of queue.ncpuLimits) {
            if (totalCpus <= limit.max) {
                maxWalltime = limit.walltime;
                maxAllowed = limit.max;
                break;
            }
        }
        
        if (maxAllowed === 0) {
            const lastLimit = queue.ncpuLimits[queue.ncpuLimits.length - 1];
            warnings.push(`NCPU exceeded: Requesting ${totalCpus} CPUs, but the maximum for ${$('queue').value} queue is ${lastLimit.max} CPUs.`);
        } else if (totalWalltime > maxWalltime) {
            warnings.push(`Walltime limit for CPU count: For ${totalCpus} CPUs on ${$('queue').value} queue, maximum walltime is ${maxWalltime} hours, but you requested ${totalWalltime.toFixed(1)} hours.`);
        }
    }
    
    // Display warnings
    const container = $('warnings-container');
    const content = $('warnings-content');
    
    if (warnings.length > 0) {
        content.innerHTML = '<ul style="margin: 0; padding-left: 1.5rem;">' + 
            warnings.map(w => `<li>${w}</li>`).join('') + 
            '</ul><p style="margin-top: 0.5rem; margin-bottom: 0;"><small>See <a href="https://opus.nci.org.au/spaces/Help/pages/90308823/Queue+Limits" target="_blank">NCI Queue Limits</a> for details. Contact NCI helpdesk for exceptions.</small></p>';
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function updatePBSScript() {
    const isGpu = !!queue.gpus;
    const parallelEnabled = $('enable-parallel').checked;
    const queueName = $('queue').value;
    const project = $('project').value;
    const disk = $('disk').value;
    
    let cpus, mem, walltimeMinutes, numBatches;
    
    if (parallelEnabled) {
        // Parallel mode - calculate total resources for ALL concurrent tasks (nci-parallel)
        const cpusPerTask = parseInt($('cpus').value) || 1;
        const memPerTask = parseInt($('mem').value) || 1;
        const tasksPerNode = Math.floor(queue.cores / cpusPerTask);
        const nodes = parseInt($('nodes-recommended').textContent) || 1;
        const tasksPerBatch = tasksPerNode * nodes;
        numBatches = parseInt($('num-batches').textContent) || 1;
        
        // Total resources for ALL concurrent tasks across ALL nodes
        cpus = Math.min(cpusPerTask * tasksPerNode, queue.cores) * nodes;
        mem = memPerTask * tasksPerNode * nodes;
        
        // Use walltime per task for one batch
        walltimeMinutes = parseInt($('walltime').value) || 60;
        
        // Update header title
        $('pbs-header-title').textContent = 'PBS Script example';
    } else {
        // Single task mode
        cpus = parseInt($('cpus').value) || 1;
        mem = parseInt($('mem').value) || 1;
        walltimeMinutes = parseInt($('walltime').value) || 60;
        numBatches = 1;
        
        // Update header title
        $('pbs-header-title').textContent = 'PBS Script Header Example';
    }
    
    // Format walltime as HH:MM:SS from minutes
    const hours = Math.floor(walltimeMinutes / 60);
    const minutes = walltimeMinutes % 60;
    const walltimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    
    let script = `#!/bin/bash

#PBS -P ${project}
#PBS -q ${queueName}
#PBS -l ncpus=${cpus}
#PBS -l mem=${mem}GB`;

    if (isGpu) {
        const gpus = parseInt($('gpus').value) || 1;
        script += `
#PBS -l ngpus=${gpus}`;
    }

    script += `
#PBS -l jobfs=${disk}GB
#PBS -l walltime=${walltimeStr}
#PBS -l storage=scratch/${project}+gdata/${project}
#PBS -l wd`;
    
    if (parallelEnabled) {
        const cpusPerTask = parseInt($('cpus').value) || 1;
        const tasksPerNode = Math.floor(queue.cores / cpusPerTask);
        const nodes = parseInt($('nodes-recommended').textContent) || 1;
        const totalTasksInBatch = tasksPerNode * nodes;
        const totalTasks = parseInt($('total-tasks').value) || 1;
        
        script += `

# Load nci-parallel module
module load nci-parallel/1.0.0a

# Number of CPUs per parallel task
NCPUS=${cpusPerTask}

# Calculate concurrent tasks per node
M=$(( PBS_NCI_NCPUS_PER_NODE / NCPUS ))

# Run parallel tasks with nci-parallel
mpirun --np $((M * PBS_NCPUS / PBS_NCI_NCPUS_PER_NODE)) \\
       --map-by node:PE=\${NCPUS} \\
       nci-parallel \\
       --verbose \\
       --input-file \${PBS_JOBFS}/input-file`;
       
        if (numBatches > 1) {
            script += `

# NOTE: This job runs ${totalTasksInBatch} tasks concurrently (batch 1 of ${numBatches}).
# The input-file should contain ${totalTasksInBatch} commands for this batch.
# You will need to submit this ${numBatches} times with different input files
# to process all ${totalTasks} tasks.`;
        } else {
            script += `

# NOTE: This job will process all ${totalTasks} tasks concurrently.
# The input-file should contain all ${totalTasks} commands.`;
        }
    }

    $('pbs-script').textContent = script;
}

function onQueueChange() {
    queue = QUEUE_PARAMS[$('queue').value];
    const isGpu = !!queue.gpus;
    
    $('walltime').max = queue.walltime * 60; // Convert hours to minutes
    const currentMinutes = parseInt($('walltime').value) || 60;
    $('walltime').value = Math.min(currentMinutes, queue.walltime * 60);
    
    // Set CPU max to queue's core count
    $('cpus').max = queue.cores;
    const currentCpus = parseInt($('cpus').value) || 1;
    $('cpus').value = Math.min(currentCpus, queue.cores);
    
    $('gpu-label').style.display = isGpu ? 'block' : 'none';
    $('gpuram-label').style.display = isGpu ? 'block' : 'none';
    $('cpus').disabled = isGpu;
    $('mem').disabled = isGpu;
    
    if (isGpu) {
        $('gpus').value = 1;
        $('fair-share').value = (1 / queue.gpus) * 100;
    } else {
        $('cpus').value = 1;
        $('fair-share').value = (1 / queue.cores) * 100;
    }
    
    update('fair-share');
}

// Read parameters from URL and set form values
function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const fields = ['queue', 'cpus', 'mem', 'gpus', 'walltime', 'fairshare', 'project', 'disk', 'totaltasks'];
    
    fields.forEach(field => {
        if (params.has(field)) {
            const id = field === 'fairshare' ? 'fair-share' : field === 'totaltasks' ? 'total-tasks' : field;
            $(id).value = params.get(field);
        }
    });
    
    if (params.has('parallel')) {
        $('enable-parallel').checked = params.get('parallel') === 'true';
        $('parallel-config').style.display = $('enable-parallel').checked ? 'block' : 'none';
    }
}

// Update URL with current form values
function updateURL() {
    const params = new URLSearchParams();
    const isGpu = !!queue.gpus;
    
    params.set('queue', $('queue').value);
    params.set('cpus', $('cpus').value);
    params.set('mem', $('mem').value);
    if (isGpu) params.set('gpus', $('gpus').value);
    params.set('walltime', $('walltime').value);
    params.set('fairshare', $('fair-share').value);
    params.set('project', $('project').value);
    params.set('disk', $('disk').value);
    if ($('enable-parallel').checked) {
        params.set('parallel', 'true');
        params.set('totaltasks', $('total-tasks').value);
    }
    
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newURL);
}

// Copy button functionality
$('copy-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const text = $('pbs-script').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = $('copy-btn');
        const originalTooltip = btn.getAttribute('data-tooltip');
        btn.setAttribute('data-tooltip', 'Copied!');
        setTimeout(() => {
            btn.setAttribute('data-tooltip', originalTooltip);
        }, 2000);
    });
});

// Event listeners
let timer;
const debounce = fn => { clearTimeout(timer); timer = setTimeout(fn, 300); };

$('queue').addEventListener('change', onQueueChange);
$('fair-share').addEventListener('input', () => update('fair-share'));
['cpus', 'mem', 'gpus', 'walltime', 'disk', 'project', 'total-tasks'].forEach(id => 
    $(id).addEventListener('input', () => debounce(() => update(id)))
);
$('enable-parallel').addEventListener('change', () => {
    $('parallel-config').style.display = $('enable-parallel').checked ? 'block' : 'none';
    update('parallel-toggle');
});

// Initialize
const params = new URLSearchParams(window.location.search);
if (params.has('queue')) {
    $('queue').value = params.get('queue');
}
queue = QUEUE_PARAMS[$('queue').value];

// Set up UI for the queue type
const isGpu = !!queue.gpus;
$('walltime').max = queue.walltime * 60; // Convert hours to minutes
$('cpus').max = queue.cores; // Set CPU max to queue's core count
$('gpu-label').style.display = isGpu ? 'block' : 'none';
$('gpuram-label').style.display = isGpu ? 'block' : 'none';
$('cpus').disabled = isGpu;
$('mem').disabled = isGpu;

// Load all other params
loadFromURL();

// Update display without recalculating
update('url-load');

// Theme toggle functionality
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDark = savedTheme === 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-toggle').checked = isDark;
    updateThemeLabel(isDark);
}

function updateThemeLabel(isDark) {
    const label = document.getElementById('theme-label');
    label.textContent = isDark ? '☀️ Light mode' : '🌙 Dark mode';
}

function toggleTheme() {
    const checkbox = document.getElementById('theme-toggle');
    const isDark = checkbox.checked;
    const newTheme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeLabel(isDark);
}

document.getElementById('theme-toggle').addEventListener('change', toggleTheme);

// Initialize theme on page load
initTheme();