/* =========================================
   LINHAI RESIN - Main JavaScript
========================================= */

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. 初始化 3D 分子模型 (依赖 Three.js)
    initMolecule3D();

    // 2. 表单验证 (Bootstrap 5 风格)
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            } else {
                event.preventDefault(); // 阻止实际提交，演示前端效果
                alert('Message sent successfully! Our team will contact you soon.');
                form.reset();
                form.classList.remove('was-validated');
                return;
            }
            form.classList.add('was-validated');
        }, false);
    });
});

function initMolecule3D() {
    const container = document.getElementById('molecule-canvas');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    // 使用纯白 + CSS中定义的分子暗纹作为背景，此处设置透明让 CSS 背景透出来
    scene.background = null; 

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 光照设置
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    // 材质定义 (红蓝灰对标化工业)
    const carbonMat = new THREE.MeshPhongMaterial({ color: 0x1A365D }); // 碳原子 (蓝)
    const activeMat = new THREE.MeshPhongMaterial({ color: 0xD92121 }); // 功能基团 (红)
    const bondMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });   // 化学键

    const group = new THREE.Group();

    // 简易 Styrene-DVB Copolymer 占位示意结构
    const createAtom = (x, y, z, mat, radius) => {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), mat);
        mesh.position.set(x, y, z);
        group.add(mesh);
        return mesh;
    };

    const createBond = (v1, v2) => {
        const distance = v1.distanceTo(v2);
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, distance, 8), bondMat);
        cylinder.position.copy(v1).lerp(v2, 0.5);
        cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
        group.add(cylinder);
    };

    // 核心骨架构建 (六边形苯环示例)
    const center = createAtom(0, 0, 0, activeMat, 0.5);
    for(let i=0; i<6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * 2;
        const y = Math.sin(angle) * 2;
        const node = createAtom(x, y, (i%2===0?0.3:-0.3), carbonMat, 0.35);
        createBond(center.position, node.position);
    }
    
    scene.add(group);
    camera.position.z = 5;

    // 交互控制
    let isDragging = false, previousMousePosition = { x: 0, y: 0 };
    
    container.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    container.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaMove = { x: e.offsetX - previousMousePosition.x, y: e.offsetY - previousMousePosition.y };
            group.rotation.y += deltaMove.x * 0.01;
            group.rotation.x += deltaMove.y * 0.01;
        }
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });

    // 滚轮缩放
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.position.z += e.deltaY * 0.01;
        camera.position.z = Math.max(2, Math.min(10, camera.position.z));
    });

    // 双击重置
    container.addEventListener('dblclick', () => {
        group.rotation.set(0, 0, 0);
        camera.position.z = 5;
    });

    const animate = function () {
        requestAnimationFrame(animate);
        if(!isDragging) {
            group.rotation.y += 0.002;
            group.rotation.x += 0.001;
        }
        renderer.render(scene, camera);
    };
    animate();

    // 响应式适配
    window.addEventListener('resize', () => {
        if(container.clientWidth > 0){
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
}
