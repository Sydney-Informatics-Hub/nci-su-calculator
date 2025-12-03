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

// Initialize
onQueueChange();