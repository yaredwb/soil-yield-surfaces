// Math renderer for LaTeX equations
class MathRenderer {
    constructor() {
        this.initialized = false;
        this.equations = {
            MohrCoulomb: {
                title: 'Mohr-Coulomb Model',
                yieldFunction: '\\sigma_1(1-\\sin\\phi) - \\sigma_3(1+\\sin\\phi) - 2c\\cos\\phi = 0',
                description: 'The Mohr-Coulomb criterion is a widely used model in soil mechanics that defines a linear failure envelope. It creates an irregular hexagonal pyramid (φ > 0) or prism (φ = 0) in principal stress space.',
                properties: [
                    'Apex location: p = c\\cot\\phi (if φ > 0)',
                    'π-Plane shape: Irregular hexagon',
                    '3D shape: Hexagonal pyramid/prism'
                ]
            },
            DruckerPrager: {
                title: 'Drucker-Prager Model',
                yieldFunction: 'q - mp - k_d = 0',
                invariants: [
                    'p = \\frac{I_1}{3} = \\frac{\\sigma_1+\\sigma_2+\\sigma_3}{3}',
                    'q = \\sqrt{3J_2} = \\sqrt{\\frac{1}{2}[(\\sigma_1-\\sigma_2)^2 + (\\sigma_2-\\sigma_3)^2 + (\\sigma_3-\\sigma_1)^2]}'
                ],
                description: 'The Drucker-Prager criterion is a smooth, conical yield surface that approximates the Mohr-Coulomb criterion. It avoids sharp corners, making it numerically advantageous.',
                properties: [
                    'π-Plane shape: Circle',
                    '3D shape: Cone (m > 0) or cylinder (m = 0)',
                    'Parameters: m (friction), k_d (cohesion)'
                ]
            }
        };
    }

    async initialize() {
        try {
            // Configure MathJax
            window.MathJax = {
                tex: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']],
                    processEscapes: true,
                    processEnvironments: true
                },
                options: {
                    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
                },
                startup: {
                    ready: () => {
                        MathJax.startup.defaultReady();
                        this.initialized = true;
                    }
                }
            };

            // Load MathJax if not already loaded
            if (!document.getElementById('MathJax-script')) {
                const script = document.createElement('script');
                script.id = 'MathJax-script';
                script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
                script.async = true;
                document.head.appendChild(script);

                // Wait for MathJax to load
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                });
            }

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize MathJax:', error);
            throw error;
        }
    }

    updateEquations(modelType) {
        const container = document.getElementById('mathEquations');
        if (!container) return;

        const eq = this.equations[modelType];
        if (!eq) return;

        let html = `
            <div class="space-y-3">
                <h3 class="text-lg font-semibold text-blue-700">${eq.title}</h3>
                <div class="bg-blue-50 p-3 rounded-lg">
                    <p class="text-sm font-medium text-gray-700 mb-1">Yield Function:</p>
                    <p class="text-center">$$${eq.yieldFunction}$$</p>
                </div>
        `;

        if (eq.invariants) {
            html += `
                <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm font-medium text-gray-700 mb-2">Stress Invariants:</p>
                    ${eq.invariants.map(inv => `<p class="text-sm">$$${inv}$$</p>`).join('')}
                </div>
            `;
        }

        html += `
                <div class="text-sm text-gray-600">
                    <p class="font-medium mb-1">Description:</p>
                    <p class="mb-2">${eq.description}</p>
                    <p class="font-medium mb-1">Key Properties:</p>
                    <ul class="list-disc list-inside space-y-1">
                        ${eq.properties.map(prop => `<li>$${prop}$</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Re-render math if MathJax is available
        if (this.initialized && window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise([container]).catch(err => {
                console.error('MathJax typesetting error:', err);
            });
        }
    }

    getEquations(modelType) {
        return this.equations[modelType] || null;
    }

    getAllEquations() {
        return { ...this.equations };
    }
}
