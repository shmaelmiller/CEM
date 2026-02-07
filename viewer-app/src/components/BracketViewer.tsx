import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
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
                    {/* Bottom */}
                    <BracketPart
                        url={getUrl('UPB10/Jack Smith-24-UPB .25 Bottom.DXF')}
                        thickness={0.25}
                        position={[0, 0, 0]}
                    />
                    {/* Left side */}
                    <BracketPart
                        url={getUrl('UPB10/Jack Smith-24-UPB .25 Lside.DXF')}
                        thickness={0.25}
                        position={[-3, 3, 0]}
                        rotation={[0, Math.PI / 2, 0]}
                    />
                    {/* Right side */}
                    <BracketPart
                        url={getUrl('UPB10/Jack Smith-24-UPB .25 Rside.DXF')}
                        thickness={0.25}
                        position={[3, 3, 0]}
                        rotation={[0, -Math.PI / 2, 0]}
                    />
                </group>
            )
        }

        return null;
    };

    return (
        <div style={{ width: '100%', height: '100vh', background: 'radial-gradient(circle, #ffffff 0%, #e0e0e0 100%)' }}>
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={40} />

                <Suspense fallback={null}>
                    <group position={[0, -3, 0]}>
                        {renderParts()}
                    </group>
                    <Environment preset="city" />
                    <ContactShadows opacity={0.4} scale={20} blur={2.4} far={10} />
                </Suspense>
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
            </Canvas>
        </div>
    );
};

export default BracketViewer;
