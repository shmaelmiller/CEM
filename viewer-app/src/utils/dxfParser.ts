import DxfParser from 'dxf-parser';
import * as THREE from 'three';

export interface DxfData {
    shapes: THREE.Shape[];
    holes: THREE.Path[];
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

    const shapes: THREE.Shape[] = [];
    const holes: THREE.Path[] = [];

    // Basic bounding box calculation
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // We assume the main outline is the largest closed path
    // and everything else might be holes or bend lines
    // For this MVP, we'll try to group entities into paths

    // Helper to update bounds
    const updateBounds = (x: number, y: number) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    };

    // Convert entities to shapes/paths
    dxf.entities.forEach((entity: any) => {
        if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
            const shape = new THREE.Shape();
            entity.vertices.forEach((v: any, i: number) => {
                if (i === 0) shape.moveTo(v.x, v.y);
                else shape.lineTo(v.x, v.y);
                updateBounds(v.x, v.y);
            });
            if (entity.shape) shape.closePath();
            shapes.push(shape);
        } else if (entity.type === 'CIRCLE') {
            const path = new THREE.Path();
            path.absarc(entity.center.x, entity.center.y, entity.radius, 0, Math.PI * 2, false);
            holes.push(path);
            updateBounds(entity.center.x - entity.radius, entity.center.y - entity.radius);
            updateBounds(entity.center.x + entity.radius, entity.center.y + entity.radius);
        } else if (entity.type === 'ARC') {
            const path = new THREE.Path();
            path.absarc(
                entity.center.x,
                entity.center.y,
                entity.radius,
                entity.startAngle * (Math.PI / 180),
                entity.endAngle * (Math.PI / 180),
                false
            );
            // We might need to connect this to a shape later
        }
    });

    return {
        shapes,
        holes,
        bounds: {
            min: { x: minX === Infinity ? 0 : minX, y: minY === Infinity ? 0 : minY },
            max: { x: maxX === -Infinity ? 1 : maxX, y: maxY === -Infinity ? 1 : maxY },
        }
    };
};
