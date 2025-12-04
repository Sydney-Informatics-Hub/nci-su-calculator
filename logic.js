const $ = id => document.getElementById(id);
let queue = null;

// Populate queue dropdown
for (const [name, params] of Object.entries(QUEUE_PARAMS)) {
    const option = document.createElement('option');
    option.value = name;
    let label = `${name}: ${params.cores} cores, ${params.mem}GB, ${params.walltime}hr`;
    if (params.gpus) label += `, ${params.gpus}gpu(${params.gpuram}GB)`;
    label += `, ${params.rate}SU/core`;
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
    if (isGpu) {
        shares.push(gpus / queue.gpus);
        shares.push((gpus / queue.gpus * queue.gpuram) / queue.gpuram);
    }
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

    // Calculate cost
    const effectiveCores = Math.ceil(fairShare * queue.cores);
    const walltime = parseFloat($('walltime').value);
    const nodes = parseInt($('nodes').value) || 1;
    const suPerNode = effectiveCores * queue.rate * walltime;
    
    $('su-per-node').textContent = suPerNode.toFixed(2);
    $('total-su').textContent = (suPerNode * nodes).toFixed(2);
    $('walltime-display').textContent = walltime.toFixed(1);
    
    $('su-per-node').textContent = suPerNode.toFixed(2);
    $('total-su').textContent = (suPerNode * nodes).toFixed(2);
    $('walltime-display').textContent = walltime.toFixed(1);
    
    updateURL();
    updatePBSScript();
}

function updatePBSScript() {
    const isGpu = !!queue.gpus;
    const cpus = parseInt($('cpus').value) || 1;
    const mem = parseInt($('mem').value) || 1;
    const walltime = parseFloat($('walltime').value);
    const queueName = $('queue').value;
    const project = $('project').value;
    const disk = $('disk').value;
    
    // Format walltime as HH:MM:SS
    const hours = Math.floor(walltime);
    const minutes = Math.floor((walltime - hours) * 60);
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

    $('pbs-script').textContent = script;
}

function onQueueChange() {
    queue = QUEUE_PARAMS[$('queue').value];
    const isGpu = !!queue.gpus;
    
    $('walltime').max = queue.walltime;
    $('walltime').value = Math.min(parseFloat($('walltime').value), queue.walltime);
    
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
    
    if (params.has('queue')) $('queue').value = params.get('queue');
    if (params.has('cpus')) $('cpus').value = params.get('cpus');
    if (params.has('mem')) $('mem').value = params.get('mem');
    if (params.has('gpus')) $('gpus').value = params.get('gpus');
    if (params.has('walltime')) $('walltime').value = params.get('walltime');
    if (params.has('nodes')) $('nodes').value = params.get('nodes');
    if (params.has('fairshare')) $('fair-share').value = params.get('fairshare');
    if (params.has('project')) $('project').value = params.get('project');
    if (params.has('disk')) $('disk').value = params.get('disk');
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
    params.set('nodes', $('nodes').value);
    params.set('fairshare', $('fair-share').value);
    params.set('project', $('project').value);
    params.set('disk', $('disk').value);
    
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

// Single event listener setup with debouncing
let timer;
const debounce = (fn) => {
    clearTimeout(timer);
    timer = setTimeout(fn, 300);
};

$('queue').addEventListener('change', onQueueChange);
$('fair-share').addEventListener('input', () => update('fair-share'));
$('cpus').addEventListener('input', () => debounce(() => update('cpus')));
$('mem').addEventListener('input', () => debounce(() => update('mem')));
$('gpus').addEventListener('input', () => debounce(() => update('gpus')));
$('walltime').addEventListener('input', () => update('walltime'));
$('nodes').addEventListener('input', () => debounce(() => update('nodes')));
$('disk').addEventListener('input', () => debounce(() => update('disk')));
$('project').addEventListener('input', () => debounce(() => update('project')));

// Initialize
const params = new URLSearchParams(window.location.search);
if (params.has('queue')) {
    $('queue').value = params.get('queue');
}
queue = QUEUE_PARAMS[$('queue').value];

// Set up UI for the queue type
const isGpu = !!queue.gpus;
$('walltime').max = queue.walltime;
$('gpu-label').style.display = isGpu ? 'block' : 'none';
$('gpuram-label').style.display = isGpu ? 'block' : 'none';
$('cpus').disabled = isGpu;
$('mem').disabled = isGpu;

// Load all other params
loadFromURL();

// Update display without recalculating
update('url-load');