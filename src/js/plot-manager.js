// Plot management class for 3D and 2D visualizations
class PlotManager {
    constructor() {
        this.plotly3D = null;
        this.piPlaneChart = null;
        this.meridianChart = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            await this.initializePlotly3D();
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize plots:', error);
            return false;
        }
    }

    async initializePlotly3D() {
        const container = document.getElementById('plot3DContainer');
        if (!container) throw new Error('3D plot container not found');

        const layout = {
            paper_bgcolor: 'rgba(255,255,255,1)',
            plot_bgcolor: 'rgba(255,255,255,1)',
            scene: {
                xaxis: {
                    title: 'σ₁ (kPa)',
                    showgrid: true,
                    gridcolor: '#e1e1e1',
                    zeroline: true,
                    zerolinewidth: 2,
                    zerolinecolor: '#333',
                    showticklabels: true,
                    titlefont: { size: 14, color: 'black' }
                },
                yaxis: {
                    title: 'σ₂ (kPa)',
                    showgrid: true,
                    gridcolor: '#e1e1e1',
                    zeroline: true,
                    zerolinewidth: 2,
                    zerolinecolor: '#333',
                    showticklabels: true,
                    titlefont: { size: 14, color: 'black' }
                },
                zaxis: {
                    title: 'σ₃ (kPa)',
                    showgrid: true,
                    gridcolor: '#e1e1e1',
                    zeroline: true,
                    zerolinewidth: 2,
                    zerolinecolor: '#333',
                    showticklabels: true,
                    titlefont: { size: 14, color: 'black' }
                },
                aspectmode: 'cube',
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.2 },
                    up: { x: 0, y: 0, z: 1 }
                }
            },
            margin: { l: 20, r: 20, b: 20, t: 20 },
            showlegend: false
        };

        await Plotly.newPlot(container, [], layout, {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'autoScale2d'],
            displaylogo: false
        });

        this.plotly3D = container;
    }

    async updateMohrCoulomb(cohesion, frictionAngle) {
        const mcModel = new MohrCoulombModel(cohesion, frictionAngle);
        
        // Update 3D plot
        if (this.plotly3D) {
            const surfaceData = mcModel.generateSurfaceData();
            const traces = [
                surfaceData,
                this.createHydrostaticAxis(),
                this.createCoordinateAxes()
            ];
            await Plotly.react(this.plotly3D, traces, this.plotly3D.layout);
        }

        // Update 2D plots
        this.updatePiPlane(mcModel.getPiPlaneData());
        this.updateMeridianPlane(mcModel.getMeridianPlaneData());
    }

    async updateDruckerPrager(slope, cohesionIntercept) {
        const dpModel = new DruckerPragerModel(slope, cohesionIntercept);
        
        // Update 3D plot
        if (this.plotly3D) {
            const surfaceData = dpModel.generateSurfaceData();
            const traces = [
                surfaceData,
                this.createHydrostaticAxis(),
                this.createCoordinateAxes()
            ];
            await Plotly.react(this.plotly3D, traces, this.plotly3D.layout);
        }

        // Update 2D plots
        this.updatePiPlane(dpModel.getPiPlaneData());
        this.updateMeridianPlane(dpModel.getMeridianPlaneData());
    }

    createHydrostaticAxis() {
        return {
            type: 'scatter3d',
            mode: 'lines',
            x: [-100, 200],
            y: [-100, 200],
            z: [-100, 200],
            line: { color: 'rgba(128,128,128,0.8)', width: 3, dash: 'dash' },
            name: 'Hydrostatic Axis',
            showlegend: false
        };
    }

    createCoordinateAxes() {
        return {
            type: 'scatter3d',
            mode: 'lines',
            x: [0, 0, 0, 150, 0, 0, 0, 150, 0, 0, 0, 150],
            y: [0, 150, 0, 0, 0, 0, 0, 0, 0, 150, 0, 0],
            z: [0, 0, 0, 0, 0, 150, 0, 0, 0, 0, 0, 0],
            line: { color: 'rgba(64,64,64,0.3)', width: 1 },
            showlegend: false
        };
    }

    updatePiPlane(data) {
        const canvas = document.getElementById('piPlaneChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        if (this.piPlaneChart) {
            this.piPlaneChart.destroy();
        }

        this.piPlaneChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    data: data.vertices,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    showLine: true,
                    pointRadius: 0,
                    fill: true,
                    tension: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'center',
                        title: { display: false },
                        grid: { 
                            display: true, 
                            color: '#e1e1e1',
                            lineWidth: 1
                        },
                        ticks: { 
                            display: true,
                            maxTicksLimit: 5,
                            font: { size: 10 }
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'center',
                        title: { display: false },
                        grid: { 
                            display: true, 
                            color: '#e1e1e1',
                            lineWidth: 1
                        },
                        ticks: { 
                            display: true,
                            maxTicksLimit: 5,
                            font: { size: 10 }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'π-Plane View',
                        font: { size: 14, weight: 'bold' },
                        color: '#374151'
                    },
                    tooltip: { enabled: false }
                },
                animation: {
                    duration: 300,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    updateMeridianPlane(data) {
        const canvas = document.getElementById('meridianPlaneChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        if (this.meridianChart) {
            this.meridianChart.destroy();
        }

        const datasets = [];
        if (data.compression) {
            datasets.push({
                label: 'Triaxial Compression',
                data: data.compression,
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.1
            });
        }
        if (data.extension) {
            datasets.push({
                label: 'Triaxial Extension',
                data: data.extension,
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                tension: 0.1
            });
        }
        if (data.envelope) {
            datasets.push({
                label: 'Yield Envelope',
                data: data.envelope,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.1
            });
        }

        this.meridianChart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'p (kPa)',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: { 
                            display: true, 
                            color: '#e1e1e1'
                        },
                        ticks: { 
                            maxTicksLimit: 6,
                            font: { size: 10 }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'q (kPa)',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: { 
                            display: true, 
                            color: '#e1e1e1'
                        },
                        ticks: { 
                            maxTicksLimit: 6,
                            font: { size: 10 }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: datasets.length > 1,
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            font: { size: 10 }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Meridian Plane (p-q)',
                        font: { size: 14, weight: 'bold' },
                        color: '#374151'
                    }
                },
                animation: {
                    duration: 300,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    getPlotData() {
        try {
            const data = {
                plot3D: this.plotly3D ? {
                    data: this.plotly3D.data,
                    layout: this.plotly3D.layout
                } : null,
                piPlane: this.piPlaneChart ? {
                    data: this.piPlaneChart.data,
                    options: this.piPlaneChart.options
                } : null,
                meridian: this.meridianChart ? {
                    data: this.meridianChart.data,
                    options: this.meridianChart.options
                } : null
            };
            return data;
        } catch (error) {
            console.error('Failed to get plot data:', error);
            return null;
        }
    }

    async get3DScreenshot() {
        try {
            if (!this.plotly3D) {
                throw new Error('3D plot not initialized');
            }

            const container = document.getElementById('plot3DContainer');
            if (!container) {
                throw new Error('3D plot container not found');
            }

            // Use Plotly's built-in screenshot functionality
            const screenshot = await Plotly.toImage(container, {
                format: 'png',
                width: 1200,
                height: 800,
                scale: 2
            });

            return screenshot;
        } catch (error) {
            console.error('Failed to capture 3D screenshot:', error);
            return null;
        }
    }

    handleResize() {
        try {
            // Resize 3D plot
            if (this.plotly3D) {
                const container = document.getElementById('plot3DContainer');
                if (container) {
                    Plotly.Plots.resize(container);
                }
            }

            // Resize 2D charts
            if (this.piPlaneChart) {
                this.piPlaneChart.resize();
            }

            if (this.meridianChart) {
                this.meridianChart.resize();
            }
        } catch (error) {
            console.error('Failed to handle resize:', error);
        }
    }
}
