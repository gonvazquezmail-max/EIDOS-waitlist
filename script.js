document.addEventListener('DOMContentLoaded', () => {
    let scene, camera, renderer, icosahedron;

    function init() {
        const container = document.body;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 2.5;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Create a low-poly icosahedron for a sci-fi look
        const geometry = new THREE.IcosahedronGeometry(1.5, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x88c0d0, // Soft blue-green
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        icosahedron = new THREE.Mesh(geometry, material);
        scene.add(icosahedron);

        // Add a glowing effect
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x88c0d0,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        const glowIcosahedron = new THREE.Mesh(geometry, glowMaterial);
        glowIcosahedron.scale.set(1.2, 1.2, 1.2);
        scene.add(glowIcosahedron);

        function animate() {
            requestAnimationFrame(animate);
            if (icosahedron) {
                icosahedron.rotation.x += 0.002;
                icosahedron.rotation.y += 0.003;
                glowIcosahedron.rotation.x += 0.002;
                glowIcosahedron.rotation.y += 0.003;

                // Simple deformation effect
                const time = Date.now() * 0.001;
                for (let i = 0; i < icosahedron.geometry.attributes.position.array.length; i += 3) {
                    const p = new THREE.Vector3(
                        icosahedron.geometry.attributes.position.array[i],
                        icosahedron.geometry.attributes.position.array[i + 1],
                        icosahedron.geometry.attributes.position.array[i + 2]
                    );
                    const distance = p.length();
                    const newY = p.y + Math.sin(distance * 5 + time) * 0.1;
                    icosahedron.geometry.attributes.position.array[i+1] = newY;
                    glowIcosahedron.geometry.attributes.position.array[i+1] = newY;
                }
                icosahedron.geometry.attributes.position.needsUpdate = true;
                glowIcosahedron.geometry.attributes.position.needsUpdate = true;
            }
            renderer.render(scene, camera);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        window.addEventListener('resize', onWindowResize, false);

        animate();
    }
    init();
});