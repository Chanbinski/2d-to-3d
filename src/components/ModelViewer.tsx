import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, useGLTF } from '@react-three/drei'
import { Suspense } from 'react'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

interface ModelViewerProps {
  modelUrl: string
}

export function ModelViewer({ modelUrl }: ModelViewerProps) {
  return (
    <div className="w-full h-64 bg-gray-100 rounded-lg">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Model url={modelUrl} />
          </Stage>
          <OrbitControls autoRotate={false} />
        </Suspense>
      </Canvas>
    </div>
  )
} 