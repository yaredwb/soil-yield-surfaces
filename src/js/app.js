// Main application controller
class SoilYieldSurfaceApp {
    constructor() {
        this.currentModel = 'MohrCoulomb';
        this.plotManager = new PlotManager();
        this.mathRenderer = new MathRenderer();
        this.config = new AppConfig();
        this.parameters = {
            MohrCoulomb: { cohesion: 10, frictionAngle: 30 },
            DruckerPrager: { slope: 0.5, cohesionIntercept: 10 }
        };
        
        // Debounced update function for better performance
        this.debouncedUpdate = Utils.debounce(() => this.updateVisualizations(), 100);
        
        this.init();
    }

    async init() {
        try {
            this.showLoading(true);
            await this.mathRenderer.initialize();
            this.setupEventListeners();
            this.setupPresets();
            this.updateUI();
            await this.plotManager.initialize();
            this.updateVisualizations();
            this.showLoading(false);
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
            this.showLoading(false);
        }
    }

    setupPresets() {
        // Add preset selection to both model sections
        this.createPresetDropdown('mohrCoulombControls', 'MohrCoulomb');
        this.createPresetDropdown('druckerPragerControls', 'DruckerPrager');
    }

    createPresetDropdown(containerId, modelType) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const presets = this.config.getAllPresets(modelType);
        
        const presetSection = document.createElement('div');
        presetSection.className = 'parameter-group';
        presetSection.innerHTML = `
            <label class="parameter-label">Material Presets:</label>
            <select id="${modelType}Presets" class="preset-select">
                <option value="">Select a preset...</option>
                ${presets.map(preset => 
                    `<option value="${preset.name}" title="${preset.description}">${preset.name}</option>`
                ).join('')}
            </select>
        `;

        // Insert preset section at the beginning
        container.insertBefore(presetSection, container.firstChild.nextSibling);

        // Add event listener
        const select = presetSection.querySelector('select');
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadPreset(modelType, e.target.value);
            }
        });
    }

    loadPreset(modelType, presetName) {
        const preset = this.config.getPreset(modelType, presetName);
        if (!preset) return;

        if (modelType === 'MohrCoulomb') {
            this.parameters.MohrCoulomb.cohesion = preset.cohesion;
            this.parameters.MohrCoulomb.frictionAngle = preset.frictionAngle;
            
            // Update UI elements
            const cohesionSlider = document.getElementById('cohesion');
            const frictionSlider = document.getElementById('frictionAngle');
            const cohesionValue = document.getElementById('cohesionValue');
            const frictionValue = document.getElementById('frictionAngleValue');
            
            if (cohesionSlider) {
                cohesionSlider.value = preset.cohesion;
                cohesionValue.textContent = preset.cohesion;
            }
            if (frictionSlider) {
                frictionSlider.value = preset.frictionAngle;
                frictionValue.textContent = preset.frictionAngle;
            }
        } else if (modelType === 'DruckerPrager') {
            this.parameters.DruckerPrager.slope = preset.slope;
            this.parameters.DruckerPrager.cohesionIntercept = preset.cohesionIntercept;
            
            // Update UI elements
            const slopeSlider = document.getElementById('dpM');
            const interceptSlider = document.getElementById('dpKd');
            const slopeValue = document.getElementById('dpMSpan');
            const interceptValue = document.getElementById('dpKdSpan');
            
            if (slopeSlider) {
                slopeSlider.value = preset.slope;
                slopeValue.textContent = preset.slope;
            }
            if (interceptSlider) {
                interceptSlider.value = preset.cohesionIntercept;
                interceptValue.textContent = preset.cohesionIntercept;
            }
        }

        // Update visualizations if this is the current model
        if (this.currentModel === modelType) {
            this.debouncedUpdate();
        }

        // Show success message
        this.showSuccess(`Loaded preset: ${presetName} - ${preset.description}`);
    }

    setupEventListeners() {
        // Model selection
        document.querySelectorAll('input[name="soilModel"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentModel = e.target.value;
                this.updateUI();
                this.debouncedUpdate();
            });
        });

        // Mohr-Coulomb parameters with validation
        const cohesionSlider = document.getElementById('cohesion');
        const frictionSlider = document.getElementById('frictionAngle');
        
        if (cohesionSlider) {
            cohesionSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (this.validateParameter('cohesion', value)) {
                    this.parameters.MohrCoulomb.cohesion = value;
                    document.getElementById('cohesionValue').textContent = value;
                    if (this.currentModel === 'MohrCoulomb') this.debouncedUpdate();
                }
            });
        }

        if (frictionSlider) {
            frictionSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (this.validateParameter('frictionAngle', value)) {
                    this.parameters.MohrCoulomb.frictionAngle = value;
                    document.getElementById('frictionAngleValue').textContent = value;
                    if (this.currentModel === 'MohrCoulomb') this.debouncedUpdate();
                }
            });
        }

        // Drucker-Prager parameters with validation
        const slopeSlider = document.getElementById('dpM');
        const interceptSlider = document.getElementById('dpKd');
        
        if (slopeSlider) {
            slopeSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (this.validateParameter('slope', value)) {
                    this.parameters.DruckerPrager.slope = value;
                    document.getElementById('dpMSpan').textContent = value;
                    if (this.currentModel === 'DruckerPrager') this.debouncedUpdate();
                }
            });
        }

        if (interceptSlider) {
            interceptSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (this.validateParameter('cohesionIntercept', value)) {
                    this.parameters.DruckerPrager.cohesionIntercept = value;
                    document.getElementById('dpKdSpan').textContent = value;
                    if (this.currentModel === 'DruckerPrager') this.debouncedUpdate();
                }
            });
        }        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Action buttons
        const resetButton = document.getElementById('resetButton');
        const exportButton = document.getElementById('exportButton');
        const screenshotButton = document.getElementById('screenshotButton');

        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetToDefaults());
        }

        if (exportButton) {
            exportButton.addEventListener('click', () => this.exportData());
        }

        if (screenshotButton) {
            screenshotButton.addEventListener('click', () => this.downloadScreenshot());
        }

        // Window resize handler
        window.addEventListener('resize', Utils.debounce(() => {
            this.plotManager.handleResize();
        }, 250));
    }

    validateParameter(param, value) {
        const schemas = {
            cohesion: { type: 'number', min: 0, max: 100 },
            frictionAngle: { type: 'number', min: 0, max: 45 },
            slope: { type: 'number', min: 0, max: 2 },
            cohesionIntercept: { type: 'number', min: 0, max: 50 }
        };

        const schema = schemas[param];
        if (!schema) return true;

        const validation = Utils.validateParameters({ [param]: value }, { [param]: schema });
        
        if (!validation.isValid) {
            this.showError(`Invalid ${param}: ${validation.errors.join(', ')}`);
            return false;
        }
        
        return true;
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + R: Reset to defaults
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.resetToDefaults();
        }
        
        // Ctrl/Cmd + E: Export data
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.exportData();
        }
        
        // Ctrl/Cmd + 1/2: Switch models
        if ((e.ctrlKey || e.metaKey) && e.key === '1') {
            e.preventDefault();
            document.getElementById('modelMohrCoulomb').checked = true;
            this.currentModel = 'MohrCoulomb';
            this.updateUI();
            this.debouncedUpdate();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === '2') {
            e.preventDefault();
            document.getElementById('modelDruckerPrager').checked = true;
            this.currentModel = 'DruckerPrager';
            this.updateUI();
            this.debouncedUpdate();
        }
    }

    resetToDefaults() {
        // Reset parameters to default values
        this.parameters = {
            MohrCoulomb: { cohesion: 10, frictionAngle: 30 },
            DruckerPrager: { slope: 0.5, cohesionIntercept: 10 }
        };

        // Update UI sliders and values
        this.updateParameterUI();
        
        // Update visualizations
        this.debouncedUpdate();
        
        this.showSuccess('Parameters reset to default values!');
    }

    updateParameterUI() {
        // Update Mohr-Coulomb UI
        const cohesionSlider = document.getElementById('cohesion');
        const frictionSlider = document.getElementById('frictionAngle');
        const cohesionValue = document.getElementById('cohesionValue');
        const frictionValue = document.getElementById('frictionAngleValue');

        if (cohesionSlider && cohesionValue) {
            cohesionSlider.value = this.parameters.MohrCoulomb.cohesion;
            cohesionValue.textContent = this.parameters.MohrCoulomb.cohesion;
        }

        if (frictionSlider && frictionValue) {
            frictionSlider.value = this.parameters.MohrCoulomb.frictionAngle;
            frictionValue.textContent = this.parameters.MohrCoulomb.frictionAngle;
        }

        // Update Drucker-Prager UI
        const slopeSlider = document.getElementById('dpM');
        const interceptSlider = document.getElementById('dpKd');
        const slopeValue = document.getElementById('dpMSpan');
        const interceptValue = document.getElementById('dpKdSpan');

        if (slopeSlider && slopeValue) {
            slopeSlider.value = this.parameters.DruckerPrager.slope;
            slopeValue.textContent = this.parameters.DruckerPrager.slope;
        }

        if (interceptSlider && interceptValue) {
            interceptSlider.value = this.parameters.DruckerPrager.cohesionIntercept;
            interceptValue.textContent = this.parameters.DruckerPrager.cohesionIntercept;
        }

        // Reset preset selections
        const mcPresets = document.getElementById('MohrCoulombPresets');
        const dpPresets = document.getElementById('DruckerPragerPresets');
        
        if (mcPresets) mcPresets.value = '';
        if (dpPresets) dpPresets.value = '';
    }

    exportData() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                currentModel: this.currentModel,
                parameters: { ...this.parameters },
                modelEquations: this.mathRenderer.getEquations(this.currentModel),
                plotData: this.plotManager.getPlotData(),
                metadata: {
                    appVersion: '2.0.0',
                    description: 'Soil Yield Surface Visualization Data'
                }
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `soil-yield-surface-${this.currentModel}-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('Data exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export data. Please try again.');
        }
    }

    async downloadScreenshot() {
        try {
            this.showLoading(true);
            const screenshot = await this.plotManager.get3DScreenshot();
            
            if (screenshot) {
                const a = document.createElement('a');
                a.href = screenshot;
                a.download = `soil-yield-surface-3D-${this.currentModel}-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                this.showSuccess('Screenshot downloaded successfully!');
            } else {
                this.showError('Failed to capture screenshot. Please try again.');
            }
        } catch (error) {
            console.error('Screenshot failed:', error);
            this.showError('Failed to capture screenshot. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // ...existing updateUI and updateVisualizations methods...

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'block' : 'none';
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existing = document.querySelectorAll('.app-message');
        existing.forEach(el => el.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `app-message ${type}-message`;
        messageDiv.innerHTML = `<strong>${type === 'error' ? 'Error:' : type === 'success' ? 'Success:' : 'Info:'}</strong> ${message}`;
        
        document.querySelector('.container').prepend(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => messageDiv.remove(), 5000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.soilApp = new SoilYieldSurfaceApp();
});
