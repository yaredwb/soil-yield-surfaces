// Mohr-Coulomb soil model implementation
class MohrCoulombModel {
    constructor(cohesion, frictionAngle) {
        this.cohesion = cohesion;
        this.frictionAngle = frictionAngle;
        this.frictionAngleRad = this.degToRad(frictionAngle);
    }

    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    generateSurfaceData() {
        const vertices = [];
        const faces_i = [], faces_j = [], faces_k = [];
        
        const c = this.cohesion;
        const phi = this.frictionAngleRad;
        const pMax = 150;

        if (phi > 1e-3) {
            // Pyramid case (phi > 0)
            let pApex = (c > 1e-3) ? c / Math.tan(phi) : 0;
            if (pApex < 0) pApex = 0;

            vertices.push({ x: pApex, y: pApex, z: pApex });
            const apexIndex = 0;

            let pBase = Math.max(pApex + 30, pMax * 0.7);
            if (pBase > pMax) pBase = pMax;

            const baseVertices = this.getHexagonVertices(pBase, c, phi);
            if (baseVertices.length === 6) {
                const baseStartIndex = vertices.length;
                baseVertices.forEach(v => vertices.push(v));

                // Create triangular faces from apex to base
                for (let i = 0; i < 6; i++) {
                    faces_i.push(apexIndex);
                    faces_j.push(baseStartIndex + i);
                    faces_k.push(baseStartIndex + (i + 1) % 6);
                }
            }
        } else {
            // Prism case (phi = 0, Tresca)
            const pLow = pMax * 0.1;
            const pHigh = pMax;
            
            const hexLow = this.getHexagonVertices(pLow, c, phi);
            const hexHigh = this.getHexagonVertices(pHigh, c, phi);

            if (hexLow.length === 6 && hexHigh.length === 6) {
                const lowStart = vertices.length;
                hexLow.forEach(v => vertices.push(v));
                const highStart = vertices.length;
                hexHigh.forEach(v => vertices.push(v));

                // Create rectangular faces between rings
                for (let i = 0; i < 6; i++) {
                    const curr = lowStart + i;
                    const next = lowStart + (i + 1) % 6;
                    const currHigh = highStart + i;
                    const nextHigh = highStart + (i + 1) % 6;

                    // Two triangles per rectangular face
                    faces_i.push(curr, next);
                    faces_j.push(next, nextHigh);
                    faces_k.push(currHigh, currHigh);
                }
            }
        }

        return {
            type: 'mesh3d',
            x: vertices.map(v => v.x),
            y: vertices.map(v => v.y),
            z: vertices.map(v => v.z),
            i: faces_i,
            j: faces_j,
            k: faces_k,
            color: '#3b82f6',
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

    getHexagonVertices(p, c, phi) {
        const qTC = this.getTriaxialCompression(p, c, phi);
        const qTE = this.getTriaxialExtension(p, c, phi);
        
        if (!isFinite(qTC) || !isFinite(qTE) || qTC < 0 || qTE < 0) {
            return [];
        }

        const sL1 = p + (2/3) * qTC;
        const sS1 = p - (1/3) * qTC;
        const sL2 = p + (1/3) * qTE;
        const sS2 = p - (2/3) * qTE;

        return [
            { x: sL1, y: sS1, z: sS1 },
            { x: sL2, y: sL2, z: sS2 },
            { x: sS1, y: sL1, z: sS1 },
            { x: sS2, y: sL2, z: sL2 },
            { x: sS1, y: sS1, z: sL1 },
            { x: sL2, y: sS2, z: sL2 }
        ];
    }

    getTriaxialCompression(p, c, phi) {
        if (Math.abs(3 - Math.sin(phi)) < 1e-6) return Infinity;
        return (6 * p * Math.sin(phi) + 6 * c * Math.cos(phi)) / (3 - Math.sin(phi));
    }

    getTriaxialExtension(p, c, phi) {
        if (Math.abs(3 + Math.sin(phi)) < 1e-6) return Infinity;
        return (6 * p * Math.sin(phi) + 6 * c * Math.cos(phi)) / (3 + Math.sin(phi));
    }

    getPiPlaneData() {
        const p = 50; // Cross-section at p = 50 kPa
        const hexVertices = this.getHexagonVertices(p, this.cohesion, this.frictionAngleRad);
        
        const vertices = hexVertices.map(v3d => {
            const s1 = v3d.x, s2 = v3d.y, s3 = v3d.z;
            // Project to π-plane
            const projX = (s2 - s3) / Math.sqrt(2);
            const projY = (2 * s1 - s2 - s3) / Math.sqrt(6);
            return { x: projX, y: projY };
        }).filter(pt => isFinite(pt.x) && isFinite(pt.y));

        // Close the polygon
        if (vertices.length > 0) {
            vertices.push(vertices[0]);
        }

        return { vertices };
    }

    getMeridianPlaneData() {
        const pValues = [];
        const qTC = [];
        const qTE = [];

        const c = this.cohesion;
        const phi = this.frictionAngleRad;
        
        let pStart = 0;
        if (phi > 1e-3 && c > 1e-3) {
            pStart = Math.max(0, c / Math.tan(phi));
        }

        for (let p = pStart; p <= 150; p += 2) {
            const tc = this.getTriaxialCompression(p, c, phi);
            const te = this.getTriaxialExtension(p, c, phi);
            
            if (isFinite(tc) && tc >= 0) {
                pValues.push(p);
                qTC.push(tc);
            }
            if (isFinite(te) && te >= 0) {
                if (qTE.length === 0 || qTE[qTE.length - 1] !== te) {
                    qTE.push(te);
                }
            }
        }

        return {
            compression: pValues.map((p, i) => ({ x: p, y: qTC[i] })),
            extension: pValues.map((p, i) => ({ x: p, y: qTE[i] }))
        };
    }
}
