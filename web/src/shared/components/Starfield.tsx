'use client';
import React, { use, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface StarfieldProps {
  starCount?: number;
}

const Starfield: React.FC<StarfieldProps> = ({ starCount = 48000 }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);

    // Geometry & Material for stars
    const geometry = new THREE.BufferGeometry();
    const minRadius = 50;
    const maxRadius = 400;

    const gridSize = Math.ceil(Math.cbrt(starCount * 1.5));
    const totalStars = gridSize ** 3;
    const positions = new Float32Array(totalStars * 3);
    const sizes = new Float32Array(totalStars);
    let starIndex = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          const fx = (x + Math.random()) / gridSize * 2 - 1;
          const fy = (y + Math.random()) / gridSize * 2 - 1;
          const fz = (z + Math.random()) / gridSize * 2 - 1;
          const i3 = starIndex * 3;
          positions[i3]     = fx * maxRadius;
          positions[i3 + 1] = fy * maxRadius;
          positions[i3 + 2] = fz * maxRadius;
          sizes[starIndex] = Math.random() * 0.4 + 0.1;
          starIndex++;
        }
      }
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Shader Material for stars
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0.0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vOpacity;
        void main() {
          vOpacity = 1.0;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float pointSize = size * uPixelRatio * 2.0;
          gl_PointSize = clamp(pointSize, 1.0, 6.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(vec3(1.0), vOpacity);
        }
      `,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    // Shooting star definition
    interface ShootingStar {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      life: number;
      maxLife: number;
    }
    const shootingStars: ShootingStar[] = [];

    const shootingStarCount = 8; // mehr initiale Schnuppen
    const shootingStarLength = 120;
    const shootingStarSpeed = 600;
    const spawnSpan = 200; // engerer Spawnbereich

    function createRandomShootingStar(): ShootingStar {
      // Startpunkt: rechts oben, Z zufällig
      const start = new THREE.Vector3(
        maxRadius,
        maxRadius,
        (Math.random() * 2 - 1) * spawnSpan
      );
      // Richtung: immer schräg nach links unten
      const dir = new THREE.Vector3(
        -1,
        -1,
        (Math.random() - 0.5) * 0.3 // wenig Z-Komponente
      ).normalize();

      // Schweiflänge zufällig
      const length = 40 + Math.random() * 80;
      const geom = new THREE.CylinderGeometry(0.07, 0.07, length, 8, 1, true);
      geom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -length / 2, 0));
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(start);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      scene.add(mesh);

      return {
        mesh,
        velocity: dir.multiplyScalar(shootingStarSpeed),
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5
      };
    }

    function createClickShootingStar(event: MouseEvent): void {
      if (!mount) return;
      const rect = mount.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const clickVector = new THREE.Vector3(x, y, 0.5).unproject(camera);
      const dir = clickVector.sub(camera.position).normalize();
      const start = camera.position.clone();

      const geom = new THREE.CylinderGeometry(0.2, 0.2, shootingStarLength, 8, 1, true);
      geom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -shootingStarLength / 2, 0));
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(start);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      scene.add(mesh);

      shootingStars.push({ mesh, velocity: dir.multiplyScalar(shootingStarSpeed), life: 0, maxLife: 0.7 + Math.random() * 0.5 });
    }

    let randomTimeout: number;
    function scheduleRandom() {
      const delay = 500 + Math.random() * 1500; // 0.5–2s
      randomTimeout = window.setTimeout(() => {
        shootingStars.push(createRandomShootingStar());
        scheduleRandom();
      }, delay);
    }
    scheduleRandom();

    for (let i = 0; i < shootingStarCount; i++) shootingStars.push(createRandomShootingStar());

    // Animation loop
    let frameId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsed;
      stars.rotation.y = elapsed * 0.02;

      shootingStars.forEach((star, idx) => {
        star.life += delta;
        const move = star.velocity.clone().multiplyScalar(delta);
        star.mesh.position.add(move);
        (star.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - star.life / star.maxLife);
        if (star.life > star.maxLife) {
          scene.remove(star.mesh);
          if (Array.isArray(star.mesh.material)) {
            star.mesh.material.forEach(mat => mat.dispose());
          } else {
            star.mesh.material.dispose();
          }
          shootingStars.splice(idx, 1);
        }
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    // Event listeners
    mount.addEventListener('click', createClickShootingStar);
    const onResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    };
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(randomTimeout);
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('click', createClickShootingStar);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      shootingStars.forEach(star => {
        scene.remove(star.mesh);
        if (Array.isArray(star.mesh.material)) {
          star.mesh.material.forEach(mat => mat.dispose());
        } else {
          star.mesh.material.dispose();
        }
      });
    };
  }, [starCount]);

  return <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, pointerEvents: 'none' }} />;
};

export default Starfield;
