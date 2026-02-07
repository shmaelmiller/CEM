import React, { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { parseDxf, type DxfData } from '../utils/dxfParser';

interface BracketPartProps {
    url: string;
    thickness?: number;
    color?: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
}

const BracketPart: React.FC<BracketPartProps> = ({
    url,
    thickness = 0.25,
    color = '#4a4a4a',
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
}) => {
    const [data, setData] = useState<DxfData | null>(null);

    useEffect(() => {
        parseDxf(url).then(setData).catch(console.error);
    }, [url]);

    const geometry = useMemo(() => {
        if (!data || data.shapes.length === 0) {
            console.log('[BracketPart] No shapes found in:', url);
            return null;
        }

        const shape = data.shapes[0];


        const extrudeSettings = {
            steps: 1,
            depth: thickness,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelOffset: 0,
            bevelSegments: 3,
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        geom.computeBoundingBox();
        const size = new THREE.Vector3();
        geom.boundingBox!.getSize(size);
        console.log(`[BracketPart] Loaded ${url}. Size:`, size);

        // Center it
        geom.center();

        return geom;
    }, [data, thickness, url]);



    if (!geometry) return null;

    return (
        <mesh
            geometry={geometry}
            position={position}
            rotation={rotation}
            scale={scale}
            castShadow
            receiveShadow
        >
            <meshStandardMaterial
                color={color}
                metalness={1}
                roughness={0.2}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};


export default BracketPart;
