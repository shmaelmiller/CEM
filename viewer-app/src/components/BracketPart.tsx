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
        if (!data || data.shapes.length === 0) return null;

        // Combine all shapes into one geometry or process them individually
        // For the MVP, we'll take the first major shape
        const shape = data.shapes[0];

        // Filter out holes that are within the geometry of the main shape
        // In a more robust version, we'd use boolean operations or check containment
        shape.holes = data.holes;

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

        // CENTER THE GEOMETRY
        geom.computeBoundingBox();
        geom.center();

        return geom;
    }, [data, thickness]);


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
                metalness={0.8}
                roughness={0.2}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

export default BracketPart;
