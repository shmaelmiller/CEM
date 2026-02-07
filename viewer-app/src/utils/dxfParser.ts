import DxfParser from 'dxf-parser';
import * as THREE from 'three';

export interface DxfData {
    shapes: THREE.Shape[];
    bounds: {
        min: { x: number; y: number };
        max: { x: number; y: number };
    };
}

export const parseDxf = async (url: string): Promise<DxfData> => {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DxfParser();
    const dxf = parser.parseSync(text);

    if (!dxf) throw new Error('Failed to parse DXF');

    const allLoops: THREE.Shape[] = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const updateBounds = (x: number, y: number) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    };

    // 1. Convert Polylines and Circles to simple loops (Shapes)
    dxf.entities.forEach((entity: any) => {
        if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
            const loop = new THREE.Shape();
            entity.vertices.forEach((v: any, i: number) => {
                if (i === 0) loop.moveTo(v.x, v.y);
                else loop.lineTo(v.x, v.y);
                updateBounds(v.x, v.y);
            });
            loop.closePath();
            allLoops.push(loop);
        } else if (entity.type === 'CIRCLE') {
            const loop = new THREE.Shape();
            loop.absarc(entity.center.x, entity.center.y, entity.radius, 0, Math.PI * 2, false);
            updateBounds(entity.center.x - entity.radius, entity.center.y - entity.radius);
            updateBounds(entity.center.x + entity.radius, entity.center.y + entity.radius);
            allLoops.push(loop);
        }
    });

    // 2. Conver Lines/Arcs into loops
    const segments = dxf.entities
        .filter((e: any) => e.type === 'LINE' || e.type === 'ARC')
        .map((e: any) => {
            if (e.type === 'LINE') {
                return { type: 'LINE', start: e.vertices[0], end: e.vertices[1] };
            } else {
                const start = {
                    x: e.center.x + e.radius * Math.cos(e.startAngle * Math.PI / 180),
                    y: e.center.y + e.radius * Math.sin(e.startAngle * Math.PI / 180)
                };
                const end = {
                    x: e.center.x + e.radius * Math.cos(e.endAngle * Math.PI / 180),
                    y: e.center.y + e.radius * Math.sin(e.endAngle * Math.PI / 180)
                };
                return { type: 'ARC', start, end, entity: e };
            }
        });

    if (segments.length > 0) {
        const used = new Set<number>();
        const threshold = 0.05;

        while (used.size < segments.length) {
            let startIdx = -1;
            for (let i = 0; i < segments.length; i++) if (!used.has(i)) { startIdx = i; break; }
            if (startIdx === -1) break;

            const loop = new THREE.Shape();
            let currentPos = segments[startIdx].start;
            loop.moveTo(currentPos.x, currentPos.y);
            updateBounds(currentPos.x, currentPos.y);

            let changed = true;
            let loopUsed = 0;
            while (changed) {
                changed = false;
                for (let i = 0; i < segments.length; i++) {
                    if (used.has(i)) continue;
                    const seg = segments[i];
                    const distS = Math.hypot(seg.start.x - currentPos.x, seg.start.y - currentPos.y);
                    const distE = Math.hypot(seg.end.x - currentPos.x, seg.end.y - currentPos.y);

                    if (distS < threshold) {
                        if (seg.type === 'LINE') loop.lineTo(seg.end.x, seg.end.y);
                        else loop.absarc(seg.entity.center.x, seg.entity.center.y, seg.entity.radius, seg.entity.startAngle * Math.PI / 180, seg.entity.endAngle * Math.PI / 180, false);
                        currentPos = seg.end;
                        updateBounds(currentPos.x, currentPos.y);
                        used.add(i);
                        changed = true;
                        loopUsed++;
                        break;
                    } else if (distE < threshold) {
                        if (seg.type === 'LINE') loop.lineTo(seg.start.x, seg.start.y);
                        else loop.absarc(seg.entity.center.x, seg.entity.center.y, seg.entity.radius, seg.entity.endAngle * Math.PI / 180, seg.entity.startAngle * Math.PI / 180, true);
                        currentPos = seg.start;
                        updateBounds(currentPos.x, currentPos.y);
                        used.add(i);
                        changed = true;
                        loopUsed++;
                        break;
                    }
                }
            }
            if (loopUsed > 0) {
                loop.closePath();
                allLoops.push(loop);
            } else {
                used.add(startIdx); // Prevent infinite loop on bad segments
            }
        }
    }

    // 3. Simple Containment: The loop with the largest area is the container
    // Internal loops are holes.
    if (allLoops.length === 0) return { shapes: [], bounds: { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } } };

    // Sort loops by geometric area (absolute)
    const sortedLoops = allLoops.sort((a, b) => {
        const areaA = Math.abs(THREE.ShapeUtils.area(a.getPoints()));
        const areaB = Math.abs(THREE.ShapeUtils.area(b.getPoints()));
        return areaB - areaA;
    });

    const mainShape = sortedLoops[0];
    const internalHoles = sortedLoops.slice(1);

    // In Three.js, holes are added as THREE.Path to Shape.holes
    mainShape.holes = internalHoles.map(h => {
        const path = new THREE.Path();
        path.setFromPoints(h.getPoints());
        return path;
    });

    console.log(`[Parser] Found ${allLoops.length} loops. Container has ${internalHoles.length} holes.`);

    return {
        shapes: [mainShape],
        bounds: {
            min: { x: minX, y: minY },
            max: { x: maxX, y: maxY },
        }
    };
};
