// Utility functions for mathematical calculations and helpers
class Utils {
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static isFiniteNumber(value) {
        return typeof value === 'number' && isFinite(value);
    }

    static formatNumber(value, decimals = 2) {
        if (!this.isFiniteNumber(value)) return 'N/A';
        return Number(value).toFixed(decimals);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Stress invariant calculations
    static meanStress(s1, s2, s3) {
        return (s1 + s2 + s3) / 3;
    }

    static deviatoricStress(s1, s2, s3) {
        const term1 = Math.pow(s1 - s2, 2);
        const term2 = Math.pow(s2 - s3, 2);
        const term3 = Math.pow(s3 - s1, 2);
        return Math.sqrt(0.5 * (term1 + term2 + term3));
    }

    static principalStressesFromPQ(p, q, theta = 0) {
        // Convert from p-q-theta to principal stresses
        // theta is the Lode angle (0 to π/3)
        const sqrt2_3 = Math.sqrt(2/3);
        const sqrt3 = Math.sqrt(3);
        
        const s1 = p + sqrt2_3 * q * Math.cos(theta);
        const s2 = p + sqrt2_3 * q * Math.cos(theta - 2*Math.PI/3);
        const s3 = p + sqrt2_3 * q * Math.cos(theta + 2*Math.PI/3);
        
        return { s1, s2, s3 };
    }

    // Pi-plane projection utilities
    static projectToPiPlane(s1, s2, s3) {
        const x = (s2 - s3) / Math.sqrt(2);
        const y = (2 * s1 - s2 - s3) / Math.sqrt(6);
        return { x, y };
    }

    static piPlaneToStresses(x, y, p) {
        // Convert pi-plane coordinates back to principal stresses
        const sqrt2 = Math.sqrt(2);
        const sqrt6 = Math.sqrt(6);
        
        const s1 = p + (y * sqrt6) / 3;
        const s2 = p - (y * sqrt6) / 6 + (x * sqrt2) / 2;
        const s3 = p - (y * sqrt6) / 6 - (x * sqrt2) / 2;
        
        return { s1, s2, s3 };
    }

    // Array utilities
    static linspace(start, end, num) {
        const result = [];
        const step = (end - start) / (num - 1);
        for (let i = 0; i < num; i++) {
            result.push(start + i * step);
        }
        return result;
    }

    static range(start, end, step = 1) {
        const result = [];
        for (let i = start; i < end; i += step) {
            result.push(i);
        }
        return result;
    }

    // Color utilities
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        if (!c1 || !c2) return color1;
        
        const r = Math.round(this.lerp(c1.r, c2.r, factor));
        const g = Math.round(this.lerp(c1.g, c2.g, factor));
        const b = Math.round(this.lerp(c1.b, c2.b, factor));
        
        return this.rgbToHex(r, g, b);
    }

    // Browser/device detection
    static isMobile() {
        return window.innerWidth <= 768;
    }

    static isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    static isDesktop() {
        return window.innerWidth > 1024;
    }

    static supportsWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    // Performance monitoring
    static measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${(end - start).toFixed(2)} milliseconds`);
        return result;
    }

    // Download utilities
    static downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    static downloadCSV(data, filename) {
        const csv = this.arrayToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadBlob(blob, filename);
    }

    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static arrayToCSV(array) {
        if (!array || array.length === 0) return '';
        
        const headers = Object.keys(array[0]);
        const csvContent = [
            headers.join(','),
            ...array.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');
        
        return csvContent;
    }

    // Validation utilities
    static validateParameters(params, schema) {
        const errors = [];
        
        for (const [key, rules] of Object.entries(schema)) {
            const value = params[key];
            
            if (rules.required && (value === undefined || value === null)) {
                errors.push(`${key} is required`);
                continue;
            }
            
            if (value !== undefined && value !== null) {
                if (rules.type && typeof value !== rules.type) {
                    errors.push(`${key} must be of type ${rules.type}`);
                }
                
                if (rules.min !== undefined && value < rules.min) {
                    errors.push(`${key} must be >= ${rules.min}`);
                }
                
                if (rules.max !== undefined && value > rules.max) {
                    errors.push(`${key} must be <= ${rules.max}`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Export for use in other modules
window.Utils = Utils;
