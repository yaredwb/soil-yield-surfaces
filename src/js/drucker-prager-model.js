// Drucker-Prager soil model implementation
class DruckerPragerModel {
    constructor(slope, cohesionIntercept) {
        this.slope = slope;  // m parameter
        this.cohesionIntercept = cohesionIntercept;  // k_d parameter
    }

    generateSurfaceData() {
        const { vertices, faces_i, faces_j, faces_k } = this.getSurfaceGeometry();

        return {
            type: 'mesh3d',
            x: vertices.map(v => v.x),
            y: vertices.map(v => v.y),
            z: vertices.map(v => v.z),
            i: faces_i,
            j: faces_j,
            k: faces_k,
            color: '#f59e0b',
            opacity: 0.7,
            flatshading: false,
            lighting: {
                ambient: 0.4,
                diffuse: 0.8,
                specular: 0.2,
                roughness: 0.3,
                fresnel: 0.2
            },
            lightposition: { x: 100, y: 100, z: 100 },
            showlegend: false
        };
    }

    getSurfaceGeometry() {
        const vertices = [];
        const faces_i = [], faces_j = [], faces_k = [];
        
        const m = this.slope;
        const kd = this.cohesionIntercept;
        const pMax = 150;
        const numThetaSteps = 24;
        const numPRings = 15;

        let pStart = 0;
        if (kd < 0 && m > 1e-6) {
            pStart = Math.max(0, -kd / m);
        }

        const pCoords = [];
        for (let i = 0; i <= numPRings; i++) {
            pCoords.push(pStart + i * (pMax - pStart) / numPRings);
        }

        // Generate vertices for the cone/cylinder
        for (let i = 0; i <= numPRings; i++) {
            const p = pCoords[i];
            let q = m * p + kd;
            q = Math.max(0, q);

            const radiusFactor = Math.sqrt(2/3) * q;

            for (let j = 0; j < numThetaSteps; j++) {
                const theta = j * (2 * Math.PI / numThetaSteps);
                const cosTheta = Math.cos(theta);
                const cos120 = Math.cos(theta - 2 * Math.PI / 3);
                const cos240 = Math.cos(theta + 2 * Math.PI / 3);

                vertices.push({
                    x: p + radiusFactor * cosTheta,
                    y: p + radiusFactor * cos120,
                    z: p + radiusFactor * cos240
                });
            }
        }

        // Generate faces for the cone/cylinder sides
        for (let i = 0; i < numPRings; i++) {
            for (let j = 0; j < numThetaSteps; j++) {
                const currentRing = i * numThetaSteps;
                const nextRing = (i + 1) * numThetaSteps;

                const v0 = currentRing + j;
                const v1 = currentRing + (j + 1) % numThetaSteps;
                const v2 = nextRing + (j + 1) % numThetaSteps;
                const v3 = nextRing + j;

                // Two triangles per quad
                faces_i.push(v0, v0);
                faces_j.push(v1, v3);
                faces_k.push(v3, v2);
            }
        }

        // Add end caps if needed
        const qBase = m * pMax + kd;
        if (qBase > 1e-3) {
            const baseRingStart = numPRings * numThetaSteps;
            for (let j = 0; j < numThetaSteps - 2; j++) {
                faces_i.push(baseRingStart);
                faces_j.push(baseRingStart + j + 1);
                faces_k.push(baseRingStart + j + 2);
            }
        }

        const qStart = m * pStart + kd;
        if (qStart > 1e-3) {
            for (let j = 0; j < numThetaSteps - 2; j++) {
                faces_i.push(0);
                faces_j.push(j + 2);
                faces_k.push(j + 1);
            }
        }

        return { vertices, faces_i, faces_j, faces_k };
    }

    getPiPlaneData() {
        const p = 50; // Cross-section at p = 50 kPa
        const q = this.slope * p + this.cohesionIntercept;
        
        if (q < 0) {
            return { vertices: [] };
        }

        const radius = q * Math.sqrt(2/3);
        const vertices = [];
        const numPoints = 50;

        for (let i = 0; i <= numPoints; i++) {
            const theta = (i / numPoints) * 2 * Math.PI;
            vertices.push({
                x: radius * Math.cos(theta),
                y: radius * Math.sin(theta)
            });
        }

        return { vertices };
    }

    getMeridianPlaneData() {
        const pValues = [];
        const qValues = [];
        
        const m = this.slope;
        const kd = this.cohesionIntercept;
        
        let pStart = 0;
        if (kd < 0 && m > 1e-6) {
            pStart = Math.max(0, -kd / m);
        }

        for (let p = pStart; p <= 150; p += 2) {
            const q = m * p + kd;
            if (q >= 0) {
                pValues.push(p);
                qValues.push(q);
            }
        }

        return {
            envelope: pValues.map((p, i) => ({ x: p, y: qValues[i] }))
        };
    }
}
