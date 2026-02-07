import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stage } from '@react-three/drei';

import BracketPart from './BracketPart';

interface BracketViewerProps {
    sku: string;
    options: Record<string, any>;
}

const BracketViewer: React.FC<BracketViewerProps> = ({ sku, options }) => {
    const renderParts = () => {
        const getUrl = (path: string) => encodeURI(`/assets/skus/${path}`);

        if (sku === 'JHCB10') {
            return (
                <BracketPart
                    url={getUrl('JHCB10/Catherine Stoll-5- JHCB .250.DXF')}
                    thickness={parseFloat(options['STEEL THICKNESS']) || 0.25}
                />
            );
        }

        if (sku === 'UPB10') {
            return (
                <group>
                    {/* Bottom Plate */}
                    <BracketPart
                        url={getUrl('UPB10/Jack Smith-24-UPB .25 Bottom.DXF')}
                        thickness={0.25}
                        position={[0, -0.25, 0]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                    {/* Side A */}
                    <BracketPart
                        url={getUrl('UPB10/Jack Smith-24-UPB .25 Lside.DXF')}
                        thickness={0.25}
                        position={[-3, 4, 0]}
                        rotation={[0, Math.PI / 2, 0]}
                    />
                    {/* Side B */}
                    <BracketPart
                        url={getUrl('UPB10/Jack Smith-24-UPB .25 Rside.DXF')}
                        thickness={0.25}
                        position={[3, 4, 0]}
                        rotation={[0, -Math.PI / 2, 0]}
                    />
                </group>
            )
        }

        return null;
    };

    return (
        <div style={{ width: '100%', height: '100vh', background: '#e8e8e8' }}>
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[30, 30, 30]} fov={35} />

                <Suspense fallback={null}>
                    <Stage
                        intensity={0.5}
                        environment="city"
                        adjustCamera={false}
                        shadows={{ type: 'contact', opacity: 0.2, blur: 2 }}
                    >
                        <group rotation={[0, -Math.PI / 4, 0]}>
                            {renderParts()}
                        </group>
                    </Stage>
                </Suspense>

                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
            </Canvas>
        </div>
    );
};


export default BracketViewer;
