// Configuration and preset combinations for the soil yield surface visualizer
class AppConfig {
    constructor() {
        this.presets = {
            MohrCoulomb: [
                {
                    name: "Soft Clay",
                    description: "Typical parameters for soft saturated clay",
                    cohesion: 15,
                    frictionAngle: 0,
                    color: "#8b5cf6"
                },
                {
                    name: "Medium Clay",
                    description: "Medium strength clay with some friction",
                    cohesion: 25,
                    frictionAngle: 15,
                    color: "#06b6d4"
                },
                {
                    name: "Dense Sand",
                    description: "Dense granular material with high friction",
                    cohesion: 0,
                    frictionAngle: 38,
                    color: "#f59e0b"
                },
                {
                    name: "Cohesive Soil",
                    description: "Mixed soil with moderate cohesion and friction",
                    cohesion: 20,
                    frictionAngle: 25,
                    color: "#10b981"
                },
                {
                    name: "Rock Material",
                    description: "Strong rock-like material",
                    cohesion: 50,
                    frictionAngle: 35,
                    color: "#ef4444"
                }
            ],
            DruckerPrager: [
                {
                    name: "Low Friction",
                    description: "Material with low friction parameter",
                    slope: 0.2,
                    cohesionIntercept: 15,
                    color: "#8b5cf6"
                },
                {
                    name: "Moderate Friction",
                    description: "Typical granular material",
                    slope: 0.6,
                    cohesionIntercept: 10,
                    color: "#06b6d4"
                },
                {
                    name: "High Friction",
                    description: "Dense granular material",
                    slope: 1.2,
                    cohesionIntercept: 5,
                    color: "#f59e0b"
                },
                {
                    name: "Cohesive Material",
                    description: "High cohesion, moderate friction",
                    slope: 0.4,
                    cohesionIntercept: 25,
                    color: "#10b981"
                },
                {
                    name: "Von Mises (m=0)",
                    description: "Pressure-independent yield (cylinder)",
                    slope: 0.0,
                    cohesionIntercept: 20,
                    color: "#ef4444"
                }
            ]
        };

        this.plotSettings = {
            stress_range: {
                min: -50,
                max: 200
            },
            pi_plane_p: 50,
            meridian_p_max: 150,
            colors: {
                mohr_coulomb: '#3b82f6',
                drucker_prager: '#f59e0b',
                hydrostatic_axis: 'rgba(128,128,128,0.8)',
                coordinate_axes: 'rgba(64,64,64,0.3)'
            },
            animation: {
                duration: 300,
                easing: 'easeInOutQuart'
            }
        };

        this.ui_settings = {
            auto_update: true,
            show_equations: true,
            show_descriptions: true,
            responsive_breakpoints: {
                mobile: 768,
                tablet: 1024
            }
        };
    }

    getPreset(model, name) {
        const modelPresets = this.presets[model];
        return modelPresets ? modelPresets.find(preset => preset.name === name) : null;
    }

    getAllPresets(model) {
        return this.presets[model] || [];
    }

    getPlotSettings() {
        return this.plotSettings;
    }

    getUISettings() {
        return this.ui_settings;
    }
}

// Export for use in other modules
window.AppConfig = AppConfig;
