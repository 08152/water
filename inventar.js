
export class Inventory {

    constructor(maxSlots = 7) {
        this.maxSlots = maxSlots;
        this.items = [];
        this.createUI();
        this.updateUI();
    }

    createUI() {
        const inventory = document.createElement("div");
        inventory.id = "inventory";

        inventory.innerHTML = `
            <div class="inventory-title">INVENTAR</div>
            <div id="inventory-slots"></div>
            <div id="inventory-count">0 Münzen</div>
        `;

        document.body.appendChild(inventory);

        const style = document.createElement("style");

        style.textContent = `
            #inventory {
                position: fixed;
                left: 50%;
                bottom: 24px;
                transform: translateX(-50%);
                z-index: 20;
                width: min(560px, 92vw);
                padding: 12px;
                background: rgba(10, 12, 17, 0.92);
                border: 1px solid rgba(255, 205, 75, 0.6);
                border-radius: 12px;
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
                pointer-events: none;
                backdrop-filter: blur(8px);
            }

            .inventory-title {
                color: #ffd45b;
                font-size: 12px;
                letter-spacing: 3px;
                margin-bottom: 10px;
                font-weight: bold;
            }

            #inventory-slots {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 8px;
            }

            .inventory-slot {
                aspect-ratio: 1;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.16);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }

            .inventory-slot.filled {
                background: linear-gradient(
                    145deg,
                    rgba(255,200,50,0.22),
                    rgba(120,75,10,0.2)
                );
                border-color: #dba72b;
            }

            .inventory-icon {
                font-size: 25px;
            }

            .inventory-amount {
                position: absolute;
                right: 5px;
                bottom: 4px;
                color: white;
                font-size: 12px;
                font-weight: bold;
                text-shadow: 0 1px 4px black;
            }

            .slot-number {
                position: absolute;
                left: 5px;
                top: 4px;
                font-size: 9px;
                color: rgba(255,255,255,0.45);
            }

            #inventory-count {
                color: #ddd;
                font-size: 11px;
                margin-top: 9px;
            }
        `;

        document.head.appendChild(style);

        const slots = document.getElementById("inventory-slots");

        for (let i = 0; i < this.maxSlots; i++) {
            const slot = document.createElement("div");
            slot.className = "inventory-slot";
            slots.appendChild(slot);
        }
    }

    // Münzen in einem gemeinsamen Stapel sammeln
    add(item) {

        let coinStack = this.items.find(
            stack => stack.type === "coin"
        );

        if (coinStack) {
            coinStack.amount++;
        } else {

            if (this.items.length >= this.maxSlots) {
                return false;
            }

            this.items.push({
                type: "coin",
                amount: 1
            });
        }

        this.updateUI();
        return true;
    }

    // Eine Münze aus dem Stapel nehmen
    remove() {

        const coinStack = this.items.find(
            stack => stack.type === "coin"
        );

        if (!coinStack) return null;

        coinStack.amount--;

        const item = {
            type: "coin"
        };

        if (coinStack.amount <= 0) {
            this.items = this.items.filter(
                stack => stack !== coinStack
            );
        }

        this.updateUI();

        return item;
    }

    get count() {
        return this.items.reduce(
            (total, stack) => total + stack.amount,
            0
        );
    }

    get maxStackSlots() {
        return this.maxSlots;
    }

    updateUI() {

        const slots = document.querySelectorAll(
            ".inventory-slot"
        );

        slots.forEach((slot, index) => {

            const stack = this.items[index];

            slot.classList.toggle("filled", !!stack);

            slot.innerHTML = `
                <span class="slot-number">${index + 1}</span>
                ${
                    stack
                    ? `
                        <span class="inventory-icon">🪙</span>
                        <span class="inventory-amount">${stack.amount}</span>
                    `
                    : ""
                }
            `;
        });

        const count = document.getElementById(
            "inventory-count"
        );

        if (count) {
            count.textContent =
                `${this.count.toLocaleString("de-DE")} Münzen gesammelt`;
        }
    }
}
