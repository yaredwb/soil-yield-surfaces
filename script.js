// --- Global Variables ---
let piPlaneChartInstance, meridianPlaneChartInstance;
let cohesionSlider, frictionAngleSlider, cohesionValueSpan, frictionAngleValueSpan;
let dpMSlider, dpKdSlider, dpMSpan, dpKdSpan;
let plot3DDivElement;
let mohrCoulombControlsDiv, druckerPragerControlsDiv;
let modelRadios;
let currentModel = 'MohrCoulomb'; // Default model
let mathEquationsDiv;


// --- Simplified MathJax Loader ---
function loadMathJax() {
    if (!document.getElementById('MathJax-script')) {
        const script = document.createElement('script');
        script.id = 'MathJax-script';
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        script.async = true;
        document.head.appendChild(script);
        script.onerror = () => {
            console.error("MathJax script FAILED to load. Check network or CDN issues.");
            const mathElements = document.querySelectorAll('p, span, label, h3'); // Target common text containers
            mathElements.forEach(el => {
                if (el.innerHTML.match(/\$.*?\$/) || el.innerHTML.match(/\\\(.*?\\\)/) || el.innerHTML.match(/\\\[.*?\\\]/)) {
                     el.innerHTML += " <em class='text-red-500'>(Math equations may not render: MathJax failed to load)</em>";
                }
            });
        };
    }
}

function degToRad(degrees) { return degrees * (Math.PI / 180); }

function initPlotly3DPlot() {
    console.log("Initializing Plotly 3D plot...");
    if (typeof Plotly === 'undefined') {
        console.error("FATAL: Plotly is undefined.");
        if (plot3DDivElement) plot3DDivElement.innerHTML = "<p class='text-red-500 p-4'>Error: Plotly.js library not loaded.</p>";
        return false;
    }
    try {
        const layout = {
            paper_bgcolor: 'rgba(255,255,255,1)',
            plot_bgcolor: 'rgba(255,255,255,1)',
            scene: {
                xaxis: {
                    title: 'σ₁', showgrid: false, zeroline: true, zerolinewidth: 1.5, zerolinecolor: '#333',
                    showticklabels: false, ticks: '', showbackground: false,
                    linecolor: 'black', linewidth: 1.5, range: [-50, 200],
                    titlefont: {size: 16, color: 'black'}
                },
                yaxis: {
                    title: 'σ₂', showgrid: false, zeroline: true, zerolinewidth: 1.5, zerolinecolor: '#333',
                    showticklabels: false, ticks: '', showbackground: false,
                    linecolor: 'black', linewidth: 1.5, range: [-50, 200],
                    titlefont: {size: 16, color: 'black'}
                },
                zaxis: {
                    title: 'σ₃', showgrid: false, zeroline: true, zerolinewidth: 1.5, zerolinecolor: '#333',
                    showticklabels: false, ticks: '', showbackground: false,
                    linecolor: 'black', linewidth: 1.5, range: [-50, 200],
                    titlefont: {size: 16, color: 'black'}
                },
                aspectmode: 'cube',
                camera: {
                    eye: { x: 1.6, y: 1.6, z: 0.8 },
                    up: { x: 0, y: 0, z: 1 }
                }
            },
            margin: { l: 5, r: 5, b: 5, t: 5 },
            showlegend: false
        };
        Plotly.newPlot(plot3DDivElement, [], layout, {responsive: true, displayModeBar: false});
        console.log("Plotly 3D plot initialized.");
        return true;
    } catch (e) {
        console.error("Error in initPlotly3DPlot:", e);
        if (plot3DDivElement) plot3DDivElement.innerHTML = `<p class='text-red-500 p-4'>Error initializing 3D plot: ${e.message || 'Unknown error'}.</p>`;
        return false;
    }
}

// Mohr-Coulomb helper functions
function get_q_TC(p, c_val, phi_r) {
    if (Math.abs(3 - Math.sin(phi_r)) < 1e-6) return Infinity;
    return (6 * p * Math.sin(phi_r) + 6 * c_val * Math.cos(phi_r)) / (3 - Math.sin(phi_r));
}
function get_q_TE(p, c_val, phi_r) {
    if (Math.abs(3 + Math.sin(phi_r)) < 1e-6) return Infinity;
    return (6 * p * Math.sin(phi_r) + 6 * c_val * Math.cos(phi_r)) / (3 + Math.sin(phi_r));
}
function getHexagonVerticesPlotly(p_val, c_val, phi_r) {
    const q_tc_val = get_q_TC(p_val, c_val, phi_r);
    const q_te_val = get_q_TE(p_val, c_val, phi_r);
    if (!isFinite(q_tc_val) || !isFinite(q_te_val) || q_tc_val < 0 || q_te_val < 0) return [];
    const sL1 = p_val + (2/3) * q_tc_val; const sS1 = p_val - (1/3) * q_tc_val;
    const sL2 = p_val + (1/3) * q_te_val; const sS2 = p_val - (2/3) * q_te_val;
    return [
        { x: sL1, y: sS1, z: sS1 }, { x: sL2, y: sL2, z: sS2 },
        { x: sS1, y: sL1, z: sS1 }, { x: sS2, y: sL2, z: sL2 },
        { x: sS1, y: sS1, z: sL1 }, { x: sL2, y: sS2, z: sL2 }
    ];
}

function updateMohrCoulombSurface() {
    console.log("Updating Mohr-Coulomb surface...");
    let currentCohesion = 10, currentFrictionAngle = 30;
    if (cohesionSlider) currentCohesion = parseFloat(cohesionSlider.value);
    if (frictionAngleSlider) currentFrictionAngle = parseFloat(frictionAngleSlider.value);

    const c = currentCohesion;
    const phiRad = degToRad(currentFrictionAngle);
    const p_max_visualization = 150;

    const vertices = [];
    const faces_i = [], faces_j = [], faces_k = [];

    if (phiRad > 1e-3) {
        let p_apex = (c > 1e-3) ? c / Math.tan(phiRad) : 0;
        if (p_apex < 0) p_apex = 0;

        vertices.push({ x: p_apex, y: p_apex, z: p_apex });
        const apexIndex = 0;
        let p_base = Math.max(p_apex + 20, p_max_visualization * 0.6);
        if (c === 0 && phiRad > 0) p_base = p_max_visualization * 0.6;
        if (p_base <= p_apex && c > 0) p_base = p_apex + Math.max(20, Math.abs(p_apex * 0.5) + 10) ;
        if (p_base > p_max_visualization) p_base = p_max_visualization;

        const baseHexVertices = getHexagonVerticesPlotly(p_base, c, phiRad);

        if (baseHexVertices.length === 6) {
            const baseStartIndex = vertices.length;
            baseHexVertices.forEach(v => vertices.push(v));

            for (let i = 0; i < 6; i++) {
                faces_i.push(apexIndex);
                faces_j.push(baseStartIndex + i);
                faces_k.push(baseStartIndex + (i + 1) % 6);
            }
        }
    } else { 
        const p_low = Math.max(0.1, p_max_visualization * 0.05);
        const p_high = p_max_visualization;
        const hexLowVertices = getHexagonVerticesPlotly(p_low, c, phiRad);
        const hexHighVertices = getHexagonVerticesPlotly(p_high, c, phiRad);

        if (hexLowVertices.length === 6 && hexHighVertices.length === 6) {
            const lowStartIndex = vertices.length;
            hexLowVertices.forEach(v => vertices.push(v));
            const highStartIndex = vertices.length;
            hexHighVertices.forEach(v => vertices.push(v));
            for (let i = 0; i < 6; i++) {
                const currentLowIdx = lowStartIndex + i;
                const nextLowIdx    = lowStartIndex + (i + 1) % 6;
                const currentHighIdx= highStartIndex + i;
                const nextHighIdx   = highStartIndex + (i + 1) % 6;
                faces_i.push(currentLowIdx); faces_j.push(nextLowIdx); faces_k.push(currentHighIdx);
                faces_i.push(nextLowIdx); faces_j.push(nextHighIdx); faces_k.push(currentHighIdx);
            }

            for (let i = 0; i < 4; i++) {
                faces_i.push(lowStartIndex);
                faces_j.push(lowStartIndex + i + 1);
                faces_k.push(lowStartIndex + i + 2);
            }

            for (let i = 0; i < 4; i++) {
                faces_i.push(highStartIndex);
                faces_j.push(highStartIndex + i + 1);
                faces_k.push(highStartIndex + i + 2);
            }
        }
    }

    if (plot3DDivElement && typeof Plotly !== 'undefined' && vertices.length > 0) {
        const trace = {
            type: 'mesh3d',
            x: vertices.map(v => v.x), y: vertices.map(v => v.y), z: vertices.map(v => v.z),
            i: faces_i, j: faces_j, k: faces_k,
            color: '#0033cc',
            opacity: 0.50,
            flatshading: true,
            line: { show: true, color: 'black', width: 2 },
            lighting: { ambient: 0.7, diffuse: 1.0, specular: 0.2, fresnel: 0.1, roughness: 0.5 },
            lightposition: {x:1000, y:1000, z:1000}
        };
        const hydrostatic_axis = {
            type: 'scatter3d', mode: 'lines',
            x: [-150, 150], y: [-150, 150], z: [-150, 150],
            line: { color: 'rgb(80,80,80)', width: 2, dash: 'solid' },
            name: 'Hydrostatic Axis'
        };

        const currentLayout = plot3DDivElement.layout || {};
        const sceneLayout = currentLayout.scene || {};
        const newLayout = {
            ...currentLayout,
            paper_bgcolor: 'rgba(255,255,255,1)',
            plot_bgcolor: 'rgba(255,255,255,1)',
            scene: {
                ...sceneLayout,
                xaxis: { ...sceneLayout.xaxis, title: 'σ₁', showgrid: false, zeroline: true, zerolinewidth: 1, zerolinecolor: '#505050', showticklabels: false, ticks:'', showbackground: false, linecolor: 'black', linewidth: 1},
                yaxis: { ...sceneLayout.yaxis, title: 'σ₂', showgrid: false, zeroline: true, zerolinewidth: 1, zerolinecolor: '#505050', showticklabels: false, ticks:'', showbackground: false, linecolor: 'black', linewidth: 1},
                zaxis: { ...sceneLayout.zaxis, title: 'σ₃', showgrid: false, zeroline: true, zerolinewidth: 1, zerolinecolor: '#505050', showticklabels: false, ticks:'', showbackground: false, linecolor: 'black', linewidth: 1},
                aspectmode: 'cube',
            }
        };
        Plotly.react(plot3DDivElement, [trace, hydrostatic_axis], newLayout);
        console.log("Plotly 3D plot updated with corrected geometry.");
    } else {
        console.warn("Could not update Plotly 3D plot. Vertices:", vertices.length);
    }
    update2DPlots(c, phiRad);
}

function update2DPlots(c, phiRad) {
    console.log("Updating 2D plots with c:", c, "phiRad:", phiRad);
    const piCanvasEl = document.getElementById('piPlaneChart');
    const meridianCanvasEl = document.getElementById('meridianPlaneChart');

    if (typeof Chart === 'undefined') { console.error("Chart.js not loaded."); return; }

    // Pi Plane Chart
    const piContainer = document.getElementById('piPlaneContainer');
    if (!piCanvasEl || !piContainer) { console.error("Pi-plane canvas/container not found."); } else {
        try {
            const piCtx = piCanvasEl.getContext('2d');
            if (!piCtx) { console.error("Failed to get 2D context for pi-plane."); } else {
                const p_for_pi_plane = 50; let rawPiVertices = [];
                const hex3DVertices = getHexagonVerticesPlotly(p_for_pi_plane, c, phiRad);
                if (hex3DVertices.length === 6) {
                    hex3DVertices.forEach(v3d => {
                        const s1=v3d.x, s2=v3d.y, s3=v3d.z;
                        const proj_x = (s2-s3)/Math.sqrt(2);
                        const proj_y = (2*s1-s2-s3)/Math.sqrt(6);
                        rawPiVertices.push({x: proj_x, y: proj_y});
                    });
                }
                const piVertices = rawPiVertices.filter(pt => isFinite(pt.x) && isFinite(pt.y));

                let max_abs_coord = 60;
                if (piVertices.length > 0) {
                    max_abs_coord = piVertices.reduce((max, pt) => Math.max(max, Math.abs(pt.x), Math.abs(pt.y)), 0) * 1.1;
                    if (max_abs_coord < 20) max_abs_coord = 20;
                }

                const pi_axis_lines_data = [
                    {
                        data: [{x: 0, y: max_abs_coord * (2/Math.sqrt(6))}, {x: 0, y: -max_abs_coord * (2/Math.sqrt(6))} ],
                        borderColor: '#aaaaaa', borderWidth: 1, borderDash: [2,2], showLine: true, pointRadius: 0, tension: 0
                    },
                    {
                        data: [{x: max_abs_coord / Math.sqrt(2), y: -max_abs_coord / Math.sqrt(6)}, {x: -max_abs_coord / Math.sqrt(2), y: max_abs_coord / Math.sqrt(6)}],
                        borderColor: '#aaaaaa', borderWidth: 1, borderDash: [2,2], showLine: true, pointRadius: 0, tension: 0
                    },
                    {
                        data: [{x: -max_abs_coord / Math.sqrt(2), y: -max_abs_coord / Math.sqrt(6)}, {x: max_abs_coord / Math.sqrt(2), y: max_abs_coord / Math.sqrt(6)}],
                        borderColor: '#aaaaaa', borderWidth: 1, borderDash: [2,2], showLine: true, pointRadius: 0, tension: 0
                    }
                ];

                if (piPlaneChartInstance) piPlaneChartInstance.destroy();
                piPlaneChartInstance = new Chart(piCtx, {
                    type: 'scatter',
                    data: {
                        datasets: [
                            {
                                data: piVertices.length > 0 ? [...piVertices, piVertices[0]] : [],
                                borderColor: 'black', borderWidth: 1.5,
                                backgroundColor: 'rgba(0,0,0,0)',
                                showLine: true, pointRadius: 0, tension: 0, order: 1
                            },
                            ...pi_axis_lines_data
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            x: {
                                title:{display:false},
                                grid:{display:false, drawOnChartArea: false},
                                ticks:{display:false},
                                border: {display: false},
                                afterDataLimits:(axis)=>{const maxAbs = Math.max(Math.abs(axis.min || 0), Math.abs(axis.max || 0), max_abs_coord); axis.min = -maxAbs; axis.max = maxAbs;}
                            },
                            y: {
                                title:{display:false},
                                grid:{display:false, drawOnChartArea: false},
                                ticks:{display:false},
                                border: {display: false},
                                afterDataLimits:(axis)=>{const maxAbs = Math.max(Math.abs(axis.min || 0), Math.abs(axis.max || 0), max_abs_coord); axis.min = -maxAbs; axis.max = maxAbs;}
                            }
                        },
                        aspectRatio:1,
                        plugins:{
                            legend:{display:false},
                            title: {
                                display: true,
                                text: 'View from Hydrostatic Axis (π-Plane)',
                                font: { size: 14, weight: 'normal' },
                                padding: { top: 5, bottom: 5 }
                            }
                        }
                    }
                });
            }
        } catch (e) { console.error("Error Pi Plane:", e); if(piContainer) piContainer.innerHTML = `<p class='text-red-500'>Error: ${e.message}</p>`; }
    }

    // Meridian Plane Chart
    const meridianContainer = document.getElementById('meridianPlaneContainer');
    if (!meridianCanvasEl || !meridianContainer) { console.error("Meridian plane canvas/container not found."); } else {
        try {
            const meridianCtx = meridianCanvasEl.getContext('2d');
             if (!meridianCtx) { console.error("Failed to get 2D context for meridian-plane."); } else {
                const p_values = []; const q_tc_values = []; const q_te_values = [];
                let p_start = (phiRad > 1e-3 && c > 1e-3) ? Math.min(100, c/Math.tan(phiRad)) : 0;
                if (p_start < 0) p_start = 0;
                for (let p_iter=p_start; p_iter<=150; p_iter+=1) {
                    p_values.push(p_iter);
                    const q_tc = get_q_TC(p_iter, c, phiRad);
                    const q_te = get_q_TE(p_iter, c, phiRad);
                    q_tc_values.push(q_tc!==null&&q_tc>=0?q_tc:NaN); q_te_values.push(q_te!==null&&q_te>=0?q_te:NaN);
                }
                if (meridianPlaneChartInstance) meridianPlaneChartInstance.destroy();
                meridianPlaneChartInstance = new Chart(meridianCtx, {
                    type: 'line',
                    data: { labels: p_values, datasets: [
                        {label:'TC',data:q_tc_values.filter(v=>!isNaN(v)),borderColor:'black',borderWidth:1.5,fill:false, tension:0.1, pointRadius:0},
                        {label:'TE',data:q_te_values.filter(v=>!isNaN(v)),borderColor:'#555555',borderDash:[3,3],borderWidth:1.5,fill:false, tension:0.1, pointRadius:0}
                    ]},
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            x:{title:{display:true,text:'p (kPa)'},grid:{display:false}, ticks:{maxTicksLimit: 7, callback: function(value, index, ticks){ if (index === 0 || index === ticks.length -1 || value % 25 === 0 || value % 50 === 0 ) return Math.round(this.getLabelForValue(value)); return '';}}},
                            y:{title:{display:true,text:'q (kPa)'},grid:{display:false}, ticks:{maxTicksLimit: 7, callback: function(value, index, ticks){ if (index === 0 || index === ticks.length -1 || value % 25 === 0 || value % 50 === 0 ) return Math.round(this.getLabelForValue(value)); return '';}}}
                        },
                        plugins:{
                            legend:{display:true, position: 'top', labels: {boxWidth:10, font: {size: 10}} },
                            title: {
                                display: true,
                                text: 'Compressive & Extensile Envelopes',
                                font: { size: 14, weight: 'normal' },
                                padding: { top: 5, bottom: 5 }
                            }
                        }
                    }
                });
            }
        } catch (e) { console.error("Error Meridian Plane:", e); if(meridianContainer) meridianContainer.innerHTML = `<p class='text-red-500'>Error: ${e.message}</p>`;}
    }
}

function setupEventListeners() {
    // MC Controls
    cohesionSlider = document.getElementById('cohesion');
    frictionAngleSlider = document.getElementById('frictionAngle');
    cohesionValueSpan = document.getElementById('cohesionValue');
    frictionAngleValueSpan = document.getElementById('frictionAngleValue');

    // DP Controls
    dpMSlider = document.getElementById('dpM');
    dpKdSlider = document.getElementById('dpKd');
    dpMSpan = document.getElementById('dpMSpan');
    dpKdSpan = document.getElementById('dpKdSpan');

    // Control Divs
    mohrCoulombControlsDiv = document.getElementById('mohrCoulombControls');
    druckerPragerControlsDiv = document.getElementById('druckerPragerControls');

    // Model Selection Radios
    modelRadios = document.querySelectorAll('input[name="soilModel"]');
    mathEquationsDiv = document.getElementById('mathEquations');

    if (cohesionSlider && frictionAngleSlider) {
        cohesionSlider.addEventListener('input', (event) => {
            cohesionValueSpan.textContent = event.target.value;
            if (currentModel === 'MohrCoulomb') updateVisualizations();
        });
        frictionAngleSlider.addEventListener('input', (event) => {
            frictionAngleValueSpan.textContent = event.target.value;
            if (currentModel === 'MohrCoulomb') updateVisualizations();
        });
    } else {
        console.error("Mohr-Coulomb sliders not found.");
    }

    if (dpMSlider && dpKdSlider) {
        dpMSlider.addEventListener('input', (event) => {
            dpMSpan.textContent = event.target.value;
            if (currentModel === 'DruckerPrager') updateVisualizations();
        });
        dpKdSlider.addEventListener('input', (event) => {
            dpKdSpan.textContent = event.target.value;
            if (currentModel === 'DruckerPrager') updateVisualizations();
        });
    } else {
        console.error("Drucker-Prager sliders not found.");
    }

    modelRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            currentModel = event.target.value;
            updateMathEquations();
            updateControlVisibility();
            updateVisualizations();
        });
    });
    console.log("Input event listeners set up.");
}

function updateControlVisibility() {
    if (currentModel === 'MohrCoulomb') {
        mohrCoulombControlsDiv.classList.remove('hidden');
        druckerPragerControlsDiv.classList.add('hidden');
    } else if (currentModel === 'DruckerPrager') {
        mohrCoulombControlsDiv.classList.add('hidden');
        druckerPragerControlsDiv.classList.remove('hidden');
    }
}

function updateVisualizations() {
    console.log("Updating visualizations for model:", currentModel);
    if (currentModel === 'MohrCoulomb') {
        updateMohrCoulombSurface();
    } else if (currentModel === 'DruckerPrager') {
        updateDruckerPragerSurface();
    }
}

// --- Drucker-Prager Implementations ---
function getDruckerPragerSurfaceData(m, kd, p_max_visualization) {
    const vertices = [];
    const faces_i = [], faces_j = [], faces_k = [];

    const num_theta_steps = 20;
    const num_p_rings = 10;

    let p_eff_start = 0;
    if (m > 1e-6 && kd < 0) {
        p_eff_start = Math.max(0, -kd / m);
    } else if (m < -1e-6 && kd > 0) {
         p_eff_start = Math.max(0, -kd/m);
    }

    const p_coords = [];
    for (let i = 0; i <= num_p_rings; i++) {
        p_coords.push(p_eff_start + i * (p_max_visualization - p_eff_start) / num_p_rings);
    }

    for (let i = 0; i <= num_p_rings; i++) {
        const p = p_coords[i];
        let q = m * p + kd;
        q = Math.max(0, q);

        const radius_factor = Math.sqrt(2/3) * q;

        for (let j = 0; j < num_theta_steps; j++) {
            const theta = j * (2 * Math.PI / num_theta_steps);
            vertices.push({
                x: p + radius_factor * Math.cos(theta),
                y: p + radius_factor * Math.cos(theta - 2 * Math.PI / 3),
                z: p + radius_factor * Math.cos(theta + 2 * Math.PI / 3)
            });
        }
    }

    for (let i = 0; i < num_p_rings; i++) {
        for (let j = 0; j < num_theta_steps; j++) {
            const current_ring_idx = i * num_theta_steps;
            const next_ring_idx = (i + 1) * num_theta_steps;

            const v0 = current_ring_idx + j;
            const v1 = current_ring_idx + (j + 1) % num_theta_steps;
            const v2 = next_ring_idx + (j + 1) % num_theta_steps;
            const v3 = next_ring_idx + j;

            faces_i.push(v0, v0);
            faces_j.push(v1, v3);
            faces_k.push(v3, v2);
        }
    }

    const q_base = m * p_max_visualization + kd;
    if (q_base > 1e-3) {
        const base_ring_start_idx = num_p_rings * num_theta_steps;
        for (let j = 0; j < num_theta_steps - 2; j++) {
            faces_i.push(base_ring_start_idx);
            faces_j.push(base_ring_start_idx + j + 1);
            faces_k.push(base_ring_start_idx + j + 2);
        }
    }

    const q_apex_end = m * p_eff_start + kd;
    if (q_apex_end > 1e-3) {
        const apex_ring_start_idx = 0;
         for (let j = 0; j < num_theta_steps - 2; j++) {
            faces_i.push(apex_ring_start_idx);
            faces_j.push(apex_ring_start_idx + j + 2);
            faces_k.push(apex_ring_start_idx + j + 1);
        }
    }

    return { vertices, faces_i, faces_j, faces_k };
}

function getDruckerPragerPiPlane(m, kd, p_val) {
    const q_val = m * p_val + kd;
    if (q_val < 0) {
        return [];
    }

    const radius = q_val * Math.sqrt(2/3);
    const vertices = [];
    const num_points = 30;

    for (let i = 0; i <= num_points; i++) {
        const theta = (i / num_points) * 2 * Math.PI;
        vertices.push({
            x: radius * Math.cos(theta),
            y: radius * Math.sin(theta)
        });
    }
    return vertices;
}

function getDruckerPragerMeridianPlane(m, kd, p_max) {
    const p_values = [];
    const q_values = [];

    let p_start = 0;
    if (kd < 0 && m > 1e-6) {
        p_start = -kd / m;
    }
    if (p_start < 0) p_start = 0;

    for (let p_iter = p_start; p_iter <= p_max; p_iter += 1) {
        p_values.push(p_iter);
        let q_val = m * p_iter + kd;
        q_values.push(q_val >= 0 ? q_val : NaN);
    }
    if (p_start > 0 && p_start <= p_max && p_values[0] > p_start) {
         p_values.unshift(p_start);
         let q_start_val = m * p_start + kd;
         q_values.unshift(q_start_val >=0 ? q_start_val : NaN);
    }
     if (p_values.length === 0 && p_start <= p_max) {
        p_values.push(p_start);
        let q_val = m*p_start + kd;
        q_values.push(q_val >= 0 ? q_val : NaN);
    }

    return { p_values, q_values };
}

function updateDruckerPragerSurface() {
    const m = parseFloat(dpMSlider.value);
    const kd = parseFloat(dpKdSlider.value);
    const p_max_visualization = 150;

    const { vertices, faces_i, faces_j, faces_k } = getDruckerPragerSurfaceData(m, kd, p_max_visualization);

    if (plot3DDivElement && typeof Plotly !== 'undefined' && vertices.length > 0) {
        const trace = {
            type: 'mesh3d',
            x: vertices.map(v => v.x), y: vertices.map(v => v.y), z: vertices.map(v => v.z),
            i: faces_i, j: faces_j, k: faces_k,
            color: '#ff6600',
            opacity: 0.50,
            flatshading: true,
            line: { show: true, color: 'black', width: 2 },
            lighting: { ambient: 0.7, diffuse: 1.0, specular: 0.2, fresnel: 0.1, roughness: 0.5 },
            lightposition: {x:1000, y:1000, z:1000}
        };
        const hydrostatic_axis = {
            type: 'scatter3d', mode: 'lines',
            x: [-150, 150], y: [-150, 150], z: [-150, 150],
            line: { color: 'rgb(80,80,80)', width: 2, dash: 'solid' },
            name: 'Hydrostatic Axis'
        };
        Plotly.react(plot3DDivElement, [trace, hydrostatic_axis], plot3DDivElement.layout);
    } else {
         Plotly.react(plot3DDivElement, [], plot3DDivElement.layout);
        console.warn("Could not update Plotly 3D plot for Drucker-Prager (no vertices).");
    }
    update2DPlotsDP(m, kd);
}

function update2DPlotsDP(m, kd) {
    const piCanvasEl = document.getElementById('piPlaneChart');
    const meridianCanvasEl = document.getElementById('meridianPlaneChart');

    if (typeof Chart === 'undefined') { console.error("Chart.js not loaded."); return; }

    // Pi Plane Chart (DP is a circle)
    const piContainer = document.getElementById('piPlaneContainer');
    if (!piCanvasEl || !piContainer) { console.error("Pi-plane canvas/container not found."); } else {
        const piCtx = piCanvasEl.getContext('2d');
        const p_for_pi_plane = 50;
        const piVertices = getDruckerPragerPiPlane(m, kd, p_for_pi_plane);

        if (piPlaneChartInstance) piPlaneChartInstance.destroy();
        piPlaneChartInstance = new Chart(piCtx, {
            type: 'scatter',
            data: { datasets: [{ 
                data: piVertices.length > 0 ? [...piVertices, piVertices[0]] : [],
                borderColor: 'black', borderWidth: 1.5, backgroundColor: 'rgba(0,0,0,0)',
                showLine: true, pointRadius: 0, tension: 0
            }]},
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: piPlaneChartInstance ? piPlaneChartInstance.options.scales : { x: {afterDataLimits:(axis)=>{const M=Math.max(Math.abs(axis.min||0),Math.abs(axis.max||0),60);axis.min=-M;axis.max=M;}}, y: {afterDataLimits:(axis)=>{const M=Math.max(Math.abs(axis.min||0),Math.abs(axis.max||0),60);axis.min=-M;axis.max=M;}} },
                aspectRatio: 1,
                plugins: { legend: { display: false }, title: { display: true, text: 'DP: π-Plane (Circle)', font: { size: 14 } } }
            }
        });
    }

    // Meridian Plane Chart (DP is a line q = mp + k_d)
    const meridianContainer = document.getElementById('meridianPlaneContainer');
    if (!meridianCanvasEl || !meridianContainer) { console.error("Meridian plane canvas/container not found."); } else {
        const meridianCtx = meridianCanvasEl.getContext('2d');
        const { p_values, q_values } = getDruckerPragerMeridianPlane(m, kd, 150);

        if (meridianPlaneChartInstance) meridianPlaneChartInstance.destroy();
        meridianPlaneChartInstance = new Chart(meridianCtx, {
            type: 'line',
            data: { labels: p_values, datasets: [{
                label: 'Yield Envelope', data: q_values, borderColor: 'black', borderWidth: 1.5, fill: false, tension: 0.1, pointRadius: 0
            }]},
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: meridianPlaneChartInstance ? meridianPlaneChartInstance.options.scales : {x:{title:{display:true,text:'p (kPa)'}}, y:{title:{display:true,text:'q (kPa)'}}},
                plugins: { legend: { display: true, position: 'top' }, title: { display: true, text: 'DP: Meridian Plane (Line)', font: { size: 14 } } }
            }
        });
    }
}

function updateMathEquations() {
    if (!mathEquationsDiv) return;
    let html = '';
    if (currentModel === 'MohrCoulomb') {
        html = `
            <p><strong class="text-gray-700">Yield Function:</strong> $\\sigma_1(1-\\sin\\phi) - \\sigma_3(1+\\sin\\phi) - 2c\\cos\\phi = 0$ (for $\\sigma_1 \\ge \\sigma_2 \\ge \\sigma_3$, compression positive).</p>
            <p><strong class="text-gray-700">Description:</strong> The Mohr-Coulomb criterion is a widely used model in soil mechanics. It defines a linear failure envelope in terms of shear stress and normal stress, or an irregular hexagonal pyramid/prism in principal stress space.</p>
            <p><strong class="text-gray-700">Apex (if $\\phi > 0$):</strong> Lies on the hydrostatic axis at $p = c \\cot\\phi$.</p>
            <p><strong class="text-gray-700">$\\pi$-Plane Shape:</strong> Irregular hexagon (becomes regular for $\\phi=0$, i.e., Tresca).</p>
        `;
    } else if (currentModel === 'DruckerPrager') {
        html = `
            <p><strong class="text-gray-700">Yield Function:</strong> $q - m p - k_d = 0$</p>
            <p>Where $p = \\frac{I_1}{3} = \\frac{\\sigma_1+\\sigma_2+\\sigma_3}{3}$ (mean stress)</p>
            <p>And $q = \\sqrt{3J_2} = \\sqrt{\\frac{1}{2}[(\\sigma_1-\\sigma_2)^2 + (\\sigma_2-\\sigma_3)^2 + (\\sigma_3-\\sigma_1)^2]}$ (deviatoric stress)</p>
            <p><strong class="text-gray-700">Description:</strong> The Drucker-Prager criterion is a smooth, conical yield surface. It can be used to approximate the Mohr-Coulomb criterion.</p>
            <p><strong class="text-gray-700">$\\pi$-Plane Shape:</strong> Circle.</p>
        `;
    }
    mathEquationsDiv.innerHTML = html;
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([mathEquationsDiv]).catch(err => console.error("MathJax typesetting error in updateMathEquations:", err));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    plot3DDivElement = document.getElementById('plot3DContainer');
    loadMathJax();
    setupEventListeners();
    updateMathEquations();
    updateControlVisibility();
});

window.onload = () => {
    if (!plot3DDivElement) {
        console.error("CRITICAL: plot3DContainer HTML element NOT FOUND by window.onload.");
        return;
    }

    setTimeout(() => {
        if (plot3DDivElement) { void plot3DDivElement.offsetHeight; } 
        let canInitialize3D = plot3DDivElement.clientWidth > 0 && plot3DDivElement.clientHeight > 0;

        if (canInitialize3D) {
            if (initPlotly3DPlot()) {
                updateVisualizations();
            } else {
                if (currentModel === 'MohrCoulomb') {
                     let c_val = 10, phi_val = 30;
                     if (cohesionSlider) c_val = parseFloat(cohesionSlider.value);
                     if (frictionAngleSlider) phi_val = parseFloat(frictionAngleSlider.value);
                     update2DPlots(c_val, degToRad(phi_val));
                } else if (currentModel === 'DruckerPrager') {
                     const m = parseFloat(dpMSlider.value);
                     const kd = parseFloat(dpKdSlider.value);
                     update2DPlotsDP(m, kd);
                }
            }
        } else {
            console.error("plot3DContainer still has zero dimensions after timeout. 3D plot cannot be initialized.");
            if(plot3DDivElement) plot3DDivElement.innerHTML = "<p class='text-red-500 p-4'>Error: 3D plot container has zero dimensions. Cannot initialize 3D plot.</p>";
            if (currentModel === 'MohrCoulomb') {
                 let c_val = 10, phi_val = 30;
                 if (cohesionSlider) c_val = parseFloat(cohesionSlider.value);
                 if (frictionAngleSlider) phi_val = parseFloat(frictionAngleSlider.value);
                 update2DPlots(c_val, degToRad(phi_val));
            } else if (currentModel === 'DruckerPrager') {
                 const m = parseFloat(dpMSlider.value);
                 const kd = parseFloat(dpKdSlider.value);
                 update2DPlotsDP(m, kd);
            }
        }
    }, 300);
};
