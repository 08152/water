
import * as THREE from "three";

export class CoinInteraction {

    constructor(scene, camera, controls, coinField, inventory) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.coinField = coinField;
        this.inventory = inventory;

        this.thrownCoins = [];
        this.pickupDistance = 4.5;
        this.gravity = 18;

        this.direction = new THREE.Vector3();
        this.tempPosition = new THREE.Vector3();

        this.onKeyDown = this.onKeyDown.bind(this);
        window.addEventListener("keydown", this.onKeyDown);

        this.message("E = Aufheben | Q = Werfen");
    }

    onKeyDown(event) {
        if (event.repeat) return;

        if (event.code === "KeyE") {
            this.pickupCoin();
        }

        if (event.code === "KeyQ") {
            this.throwCoin();
        }
    }

    findTargetCoin() {
        this.camera.getWorldDirection(this.direction);

        const origin = this.camera.position;

        // Die oberste Münzschicht wird entlang
        // der Blickrichtung abgesucht.

        for (let distance = 0.5; distance <= this.pickupDistance; distance += 0.15) {

            this.tempPosition.copy(origin).addScaledVector(
                this.direction,
                distance
            );

            if (Math.abs(this.tempPosition.y - this.coinField.topY) > 0.55) {
                continue;
            }

            const coin = this.coinField.getCoinAt(
                this.tempPosition.x,
                this.tempPosition.z
            );

            if (coin) {
                return coin;
            }
        }

        return null;
    }

    pickupCoin() {
        if (!this.controls.isLocked) return;

        if (this.inventory.count >= this.inventory.maxSlots) {
            this.message("INVENTAR VOLL!");
            return;
        }

        const coin = this.findTargetCoin();

        if (!coin) {
            this.message("Keine Münze in Reichweite");
            return;
        }

        const item = {
            index: coin.index,
            x: coin.x,
            y: coin.y,
            z: coin.z
        };

        if (!this.inventory.add(item)) return;

        // Originale Instanz unsichtbar machen.
        const matrix = new THREE.Matrix4();

        matrix.compose(
            new THREE.Vector3(coin.x, coin.y - this.coinField.topY + this.coinField.topY, coin.z),
            new THREE.Quaternion(),
            new THREE.Vector3(0, 0, 0)
        );

        this.coinField.coins.setMatrixAt(coin.index, matrix);
        this.coinField.coins.instanceMatrix.needsUpdate = true;

        this.message("MÜNZE AUFGEHOBEN");
    }

    throwCoin() {
        if (!this.controls.isLocked) return;

        const item = this.inventory.remove();

        if (!item) {
            this.message("Keine Münze im Inventar");
            return;
        }

        this.camera.getWorldDirection(this.direction);

        const geometry = this.coinField.coins.geometry;
        const material = this.coinField.coins.material;

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.copy(this.camera.position);
        mesh.position.addScaledVector(this.direction, 1.2);

        mesh.rotation.set(0, 0, 0);

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.scene.add(mesh);

        this.thrownCoins.push({
            mesh,
            velocity: this.direction.clone().multiplyScalar(10).add(
                new THREE.Vector3(0, 4, 0)
            ),
            rotationSpeed: new THREE.Vector3(
                8 + Math.random() * 5,
                3 + Math.random() * 4,
                6 + Math.random() * 5
            ),
            resting: false
        });

        this.message("MÜNZE GEWORFEN");
    }

    update(delta) {
        for (const coin of this.thrownCoins) {

            if (coin.resting) continue;

            coin.velocity.y -= this.gravity * delta;

            coin.mesh.position.addScaledVector(
                coin.velocity,
                delta
            );

            coin.mesh.rotation.x += coin.rotationSpeed.x * delta;
            coin.mesh.rotation.y += coin.rotationSpeed.y * delta;
            coin.mesh.rotation.z += coin.rotationSpeed.z * delta;

            const floorY = this.coinField.topY + 0.10;

            if (coin.mesh.position.y <= floorY) {
                coin.mesh.position.y = floorY;

                coin.velocity.y *= -0.28;
                coin.velocity.x *= 0.72;
                coin.velocity.z *= 0.72;

                if (Math.abs(coin.velocity.y) < 1.2) {
                    coin.velocity.set(0, 0, 0);
                    coin.resting = true;
                }
            }
        }
    }

    message(text) {
        let element = document.getElementById("coin-message");

        if (!element) {
            element = document.createElement("div");
            element.id = "coin-message";

            Object.assign(element.style, {
                position: "fixed",
                left: "50%",
                top: "72%",
                transform: "translateX(-50%)",
                color: "#ffdc72",
                fontFamily: "Arial",
                fontSize: "16px",
                fontWeight: "bold",
                textShadow: "0 2px 8px black",
                zIndex: "30",
                pointerEvents: "none",
                opacity: "0",
                transition: "opacity 0.2s"
            });

            document.body.appendChild(element);
        }

        element.textContent = text;
        element.style.opacity = "1";

        clearTimeout(this.messageTimeout);

        this.messageTimeout = setTimeout(() => {
            element.style.opacity = "0";
        }, 1300);
    }

    dispose() {
        window.removeEventListener("keydown", this.onKeyDown);
    }
}
