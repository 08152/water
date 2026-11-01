
import * as THREE from "three";

export function createCoinField(scene, options = {}) {

    // =========================================
    // EINSTELLUNGEN
    // =========================================

    const TOTAL_COINS = 1_000_000;
    const COINS_X = 100;
    const COINS_Z = 100;
    const LAYERS = 100;

    const SPACING = 1.65;
    const COIN_RADIUS = 0.68;
    const COIN_HEIGHT = 0.20;
    const LAYER_HEIGHT = 0.24;

    const total = COINS_X * COINS_Z * LAYERS;

    // =========================================
    // MATERIALIEN
    // =========================================

    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xffc928,
        metalness: 1.0,
        roughness: 0.23
    });

    const brightGold = new THREE.MeshStandardMaterial({
        color: 0xffe58a,
        metalness: 1.0,
        roughness: 0.19
    });

    const darkGold = new THREE.MeshStandardMaterial({
        color: 0xa96b08,
        metalness: 1.0,
        roughness: 0.3
    });

    const starMaterial = new THREE.MeshStandardMaterial({
        color: 0xfff0a5,
        metalness: 1.0,
        roughness: 0.16
    });

    // =========================================
    // MÜNZEN-GEOMETRIE
    // =========================================

    const coinGroup = new THREE.Group();

    // Hauptkörper
    const bodyGeometry = new THREE.CylinderGeometry(
        COIN_RADIUS,
        COIN_RADIUS,
        COIN_HEIGHT,
        48,
        1,
        false
    );

    // Abgeschrägte obere Münzkante
    const rimGeometry = new THREE.TorusGeometry(
        COIN_RADIUS - 0.035,
        0.035,
        8,
        64
    );

    // Innerer Gravurring
    const innerRingGeometry = new THREE.TorusGeometry(
        COIN_RADIUS * 0.73,
        0.018,
        8,
        64
    );

    // Zweiter Gravurring
    const outerRingGeometry = new THREE.TorusGeometry(
        COIN_RADIUS * 0.88,
        0.014,
        8,
        64
    );

    // Stern
    const starShape = new THREE.Shape();

    const outerRadius = 0.34;
    const innerRadius = 0.15;

    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
            starShape.moveTo(x, y);
        } else {
            starShape.lineTo(x, y);
        }
    }

    starShape.closePath();

    const starGeometry = new THREE.ExtrudeGeometry(starShape, {
        depth: 0.035,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.018,
        bevelThickness: 0.012,
        curveSegments: 8
    });

    starGeometry.rotateX(-Math.PI / 2);

    // =========================================
    // EIN GEMEINSAMES MÜNZMODELL
    // =========================================

    // Alle Details werden in eine Geometrie
    // zusammengefügt. Dadurch bleiben die Münzen
    // besonders effizient instanziierbar.

    function mergeCoinParts() {

        const geometries = [];

        function addGeometry(geometry, materialIndex, position, rotation) {
            const g = geometry.clone();

            if (rotation) {
                g.rotateX(rotation.x || 0);
                g.rotateY(rotation.y || 0);
                g.rotateZ(rotation.z || 0);
            }

            if (position) {
                g.translate(position.x || 0, position.y || 0, position.z || 0);
            }

            g.computeVertexNormals();

            g.userData.materialIndex = materialIndex;
            geometries.push(g);
        }

        addGeometry(bodyGeometry, 0, { x: 0, y: 0, z: 0 });

        // Oberer Rand
        addGeometry(
            rimGeometry,
            1,
            { x: 0, y: COIN_HEIGHT / 2, z: 0 },
            { x: Math.PI / 2 }
        );

        // Innerer Ring
        addGeometry(
            innerRingGeometry,
            2,
            { x: 0, y: COIN_HEIGHT / 2 + 0.008, z: 0 },
            { x: Math.PI / 2 }
        );

        // Äußerer Ring
        addGeometry(
            outerRingGeometry,
            1,
            { x: 0, y: COIN_HEIGHT / 2 + 0.008, z: 0 },
            { x: Math.PI / 2 }
        );

        // Stern
        addGeometry(
            starGeometry,
            3,
            { x: 0, y: COIN_HEIGHT / 2 + 0.012, z: 0 }
        );

        // Geometrien zusammenführen
        // ohne zusätzliche Bibliothek:
        const merged = mergeGeometriesSimple(geometries);

        geometries.forEach(g => g.dispose());

        return merged;
    }

    function mergeGeometriesSimple(geometries) {

        let positions = [];
        let normals = [];
        let indices = [];
        let groups = [];

        let vertexOffset = 0;

        for (let i = 0; i < geometries.length; i++) {

            const g = geometries[i].index ? geometries[i].toNonIndexed() : geometries[i];

            const pos = g.attributes.position;
            const nor = g.attributes.normal;

            const start = positions.length / 3;

            for (let j = 0; j < pos.count; j++) {
                positions.push(pos.getX(j), pos.getY(j), pos.getZ(j));
                normals.push(nor.getX(j), nor.getY(j), nor.getZ(j));
            }

            const count = pos.count;

            for (let j = 0; j < count; j++) {
                indices.push(vertexOffset + j);
            }

            groups.push({
                start: vertexOffset,
                count,
                materialIndex: geometries[i].userData.materialIndex
            });

            vertexOffset += count;

            if (g !== geometries[i]) g.dispose();
        }

        const merged = new THREE.BufferGeometry();

        merged.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
        );

        merged.setAttribute(
            "normal",
            new THREE.Float32BufferAttribute(normals, 3)
        );

        merged.setIndex(indices);

        groups.forEach(group => {
            merged.addGroup(group.start, group.count, group.materialIndex);
        });

        return merged;
    }

    const coinGeometry = mergeCoinParts();

    const materials = [
        goldMaterial,
        brightGold,
        darkGold,
        starMaterial
    ];

    // =========================================
    // INSTANCED COINS
    // =========================================

    const coins = new THREE.InstancedMesh(
        coinGeometry,
        materials,
        total
    );

    coins.count = total;
    coins.frustumCulled = false;

    const dummy = new THREE.Object3D();

    let index = 0;

    const offsetX = (COINS_X - 1) / 2;
    const offsetZ = (COINS_Z - 1) / 2;

    for (let layer = 0; layer < LAYERS; layer++) {

        const y = COIN_HEIGHT / 2 + layer * LAYER_HEIGHT;

        for (let x = 0; x < COINS_X; x++) {

            for (let z = 0; z < COINS_Z; z++) {

                dummy.position.set(
                    (x - offsetX) * SPACING,
                    y,
                    (z - offsetZ) * SPACING
                );

                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(1, 1, 1);

                dummy.updateMatrix();

                coins.setMatrixAt(index, dummy.matrix);

                index++;
            }
        }
    }

    coins.instanceMatrix.needsUpdate = true;
    coins.computeBoundingSphere();

    scene.add(coins);

    // =========================================
    // HÖHE DER OBERSTEN SCHICHT
    // =========================================

    const topY =
        COIN_HEIGHT / 2 +
        (LAYERS - 1) * LAYER_HEIGHT +
        COIN_HEIGHT / 2;

    // =========================================
    // BEGEHBARKEIT
    // =========================================

    function canStandAt(x, z, playerRadius = 0.32) {

        const gridX = Math.round(x / SPACING + offsetX);
        const gridZ = Math.round(z / SPACING + offsetZ);

        if (
            gridX < 0 ||
            gridX >= COINS_X ||
            gridZ < 0 ||
            gridZ >= COINS_Z
        ) {
            return false;
        }

        const centerX = (gridX - offsetX) * SPACING;
        const centerZ = (gridZ - offsetZ) * SPACING;

        const dx = x - centerX;
        const dz = z - centerZ;

        return Math.sqrt(dx * dx + dz * dz) <=
            COIN_RADIUS + playerRadius;
    }

    function getCoinAt(x, z) {

        const gridX = Math.round(x / SPACING + offsetX);
        const gridZ = Math.round(z / SPACING + offsetZ);

        if (
            gridX < 0 ||
            gridX >= COINS_X ||
            gridZ < 0 ||
            gridZ >= COINS_Z
        ) {
            return null;
        }

        const centerX = (gridX - offsetX) * SPACING;
        const centerZ = (gridZ - offsetZ) * SPACING;

        const dx = x - centerX;
        const dz = z - centerZ;

        if (Math.sqrt(dx * dx + dz * dz) > COIN_RADIUS) {
            return null;
        }

        return {
            x: centerX,
            z: centerZ,
            y: topY,
            layer: LAYERS - 1,
            index: (LAYERS - 1) * COINS_X * COINS_Z +
                gridX * COINS_Z + gridZ
        };
    }

    // =========================================
    // AUSGABE
    // =========================================

    return {
        total,
        layers: LAYERS,
        coinsPerLayer: COINS_X * COINS_Z,
        topY,
        spacing: SPACING,
        radius: COIN_RADIUS,
        coins,
        canStandAt,
        getCoinAt
    };
}
