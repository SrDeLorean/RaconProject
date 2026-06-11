import React, { useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { Link } from 'react-router-dom';

// --- OPCION 1: 3D REACT THREE FIBER ---
// Simulamos un "Trofeo E-sports" usando primitivas 3D para la temática.
const Trophy3D = () => {
  const groupRef = React.useRef();
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={groupRef} position={[0, -1.5, 0]}>
        {/* Base del trofeo */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.5, 2, 0.5, 32]} />
          <meshStandardMaterial color="#222" roughness={0.1} metalness={0.8} />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.5, 1, 2, 32]} />
          <meshStandardMaterial color="#ff002e" roughness={0.2} metalness={0.9} wireframe />
        </mesh>
        {/* Copa superior */}
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ff002e" roughness={0.1} metalness={1} />
        </mesh>
        <mesh position={[0, 3.5, 0]}>
          <icosahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color="#fff" wireframe />
        </mesh>
      </group>
    </Float>
  );
};

export default function TestAnimations() {
  
  // Para evitar errores con lottie-react, usamos el web component oficial directo en el DOM
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans selection:bg-red-600">
      
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="text-red-500 hover:text-red-400 mb-8 inline-block font-condensed tracking-widest">
          &larr; VOLVER AL HUB
        </Link>
        
        <h1 className="text-5xl font-display font-black text-white uppercase mb-4">
          Laboratorio <span className="text-red-500">E-Sports</span>
        </h1>
        <p className="text-red-100/60 mb-12">Ejemplos funcionales de animaciones tematizadas en Fútbol y Competición.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* OPCION 1: 3D REAL (FIBER) */}
          <div className="border border-red-500/30 rounded-2xl p-6 bg-[#111] shadow-[0_0_30px_rgba(232,0,29,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl font-display font-black text-red-500 mb-2">1. React Three Fiber (3D)</h2>
            <p className="text-sm text-red-100/60 mb-6 h-10">Trofeo dinámico generado en tiempo real. Aquí podríamos poner a un jugador de EA FC. Usa el mouse para girarlo.</p>
            
            <div className="w-full h-[300px] rounded-xl border border-white/10 overflow-hidden bg-black relative cursor-grab active:cursor-grabbing">
              <Canvas camera={{ position: [0, 0, 8] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#fff" />
                <pointLight position={[-10, -10, -10]} intensity={2} color="#ff002e" />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Trophy3D />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
              </Canvas>
              <div className="absolute bottom-2 right-2 bg-red-600/20 text-red-500 px-2 py-1 text-xs font-condensed rounded border border-red-500/50 pointer-events-none">
                INTERACTIVO 360º
              </div>
            </div>
          </div>

          {/* OPCION 2: LOTTIE (VECTOR 2D) */}
          <div className="border border-red-500/30 rounded-2xl p-6 bg-[#111] shadow-[0_0_30px_rgba(232,0,29,0.1)] relative overflow-hidden group">
            <h2 className="text-2xl font-display font-black text-red-500 mb-2">2. LottieFiles (Vector 2D)</h2>
            <p className="text-sm text-red-100/60 mb-6 h-10">Icono táctico de fútbol renderizado por Lottie. Ultra ligero, infinito, no pierde resolución. Ideal para micro-animaciones en el HUD.</p>
            
            <div className="w-full h-[300px] rounded-xl border border-white/10 overflow-hidden bg-[#0a0a0a] flex items-center justify-center relative">
               
               {/* Animación pública de un balón de fútbol táctico en Lottie */}
               <lottie-player
                  src="https://lottie.host/80a2d201-9cc4-4363-8a03-c0da53b5c00e/bW4d46tYx1.json" 
                  background="transparent"  
                  speed="1"  
                  style={{ width: '250px', height: '250px' }}  
                  loop  
                  autoplay
                  direction="1"
                  mode="normal">
                </lottie-player>

               <div className="absolute bottom-2 right-2 bg-blue-600/20 text-blue-500 px-2 py-1 text-xs font-condensed rounded border border-blue-500/50 pointer-events-none">
                VECTORES 60 FPS
              </div>
            </div>
          </div>

          {/* OPCION 4: VIDEO (WEBM / MP4) */}
          <div className="border border-red-500/30 rounded-2xl p-6 bg-[#111] shadow-[0_0_30px_rgba(232,0,29,0.1)] relative overflow-hidden group lg:col-span-2">
            <h2 className="text-2xl font-display font-black text-red-500 mb-2">3. Video Transparente o Cinematográfico (WebM / iFrame)</h2>
            <p className="text-sm text-red-100/60 mb-6">El método oficial de EA Sports. Consiste en grabar el juego real o un renderizado ultra-realista y ponerlo como fondo (sin controles, en mute). Abajo un ejemplo en iframe.</p>
            
            <div className="w-full h-[400px] rounded-xl border border-white/10 overflow-hidden bg-black relative">
               {/* Simulamos un video .webm de jugador con un iframe de un trailer competitivo, loopeado y mudo */}
               <iframe 
                  className="w-full h-[600px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60"
                  src="https://www.youtube.com/embed/XhP3Xh4LMA8?autoplay=1&mute=1&controls=0&loop=1&playlist=XhP3Xh4LMA8" 
                  title="EA FC Trailer" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
               </iframe>
               
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

               <div className="absolute bottom-10 left-10 z-10">
                 <h3 className="text-5xl font-display font-black text-white tracking-widest drop-shadow-lg">GAMEPLAY <span className="text-red-500">REAL</span></h3>
                 <p className="text-red-100 font-sans max-w-md drop-shadow">El video cinematográfico da el aspecto AAA definitivo sin sobrecargar el código de React.</p>
               </div>

               <div className="absolute bottom-2 right-2 bg-green-600/20 text-green-500 px-2 py-1 text-xs font-condensed rounded border border-green-500/50 pointer-events-none">
                RENDER AAA PRE-GRABADO
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
