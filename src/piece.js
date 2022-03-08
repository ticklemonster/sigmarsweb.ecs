import { Sprite } from '@pixi/sprite';
import { Circle } from '@pixi/math';
import { TINT_HIDE, TINT_SHOW, ALPHA_HIDE, ALPHA_SHOW, AXIAL_VECTORS } from './constants';

class Piece extends Sprite {
    static SELECT_EVENT = 'SELECT';

    constructor (type, basetexture) {
        super(basetexture);
        this.anchor.set(0.5);
        this.interactive = false;
        this.buttonMode = true;
        this.hitArea = new Circle(0, 0, 30);
        
        // custom props for this object
        this.type = type;
        this.axialPosition = { q: 0, r: 0 };
        this.selected = false;
        this.adjacent = [null, null, null, null, null, null];
        this.required = [];

        // prepare to listen for clicks
        this.addEventListener('click', () => this.setSelected(!this.selected));
    }

    addAdjacency (other) {
        for (let i in AXIAL_VECTORS) {
            const [qa, ra] = AXIAL_VECTORS[i];
            if (this.axialPosition.q + qa == other.axialPosition.q && this.axialPosition.r + ra == other.axialPosition.r) {
                this.adjacent[i] = other;
                other.addEventListener('destroyed', () => this.handleAdjacentRemoved(i));
                console.debug(`New adjacency for ${this.type} @ [${this.axialPosition.q},${this.axialPosition.r}] = ${other.type} @ [${other.axialPosition.q},${other.axialPosition.r}]`);
            }
        }

        this.updateState();
    }

    handleAdjacentRemoved (idx) {
        // if (!(piece instanceof Piece)) return;
        console.debug(`Piece ${this} heard adjacency was removed at ${idx}`, this.adjacent[idx]);
        this.adjacent[idx] = null;
        this.updateState();
    }

    addPrerequisite (other) {
        this.required.push(other);
        other.addEventListener('destroyed', () => this.handlePrereqRemoved(other));
        console.debug(`New preqreq for ${this.type} @ [${this.axialPosition.q},${this.axialPosition.r}] = ${other.type} @ [${other.axialPosition.q},${other.axialPosition.r}]`);
    }

    handlePrereqRemoved (other) {
        const idx = this.required.indexOf(other);
        console.debug(`${this} heard prereq ${other} was destroyed at ${idx}`);

        if (idx < 0) return;
        this.required.splice(idx, 1);

        this.updateState();
    }

    updateState () {
        // if there are any required, then we are not selectable
        if (this.required && this.required.length > 0) {
            this.setActive(false);
            return;
        }

        // try to find three-in-a-row adjacent...
        for (let i = 0; i < 6; i++) {
            if (!this.adjacent[i] && !this.adjacent[(i+1) % 6] && !this.adjacent[(i+2) % 6]) {
                this.setActive(true);
                return;
            }
        }

        this.setActive(false);
    }

    setActive (active) {
        this.interactive = active;
        this.tint = active ? TINT_SHOW : TINT_HIDE;
        this.alpha = active ? ALPHA_SHOW : ALPHA_HIDE;
        
        if (this.selected && !this.interactive) {
            this.setSelected(false);
        }
    }

    setSelected (select) {
        if (this.selected == select) return;

        console.debug(`Piece ${this} selected from ${this.selected} => ${select}:`);
        this.selected = select;
        this.emit(Piece.SELECT_EVENT, { piece: this, selected: this.selected });
    }

    setHighlight (show) {
        this.tint = (show || this.interactive) ? TINT_SHOW : TINT_HIDE;
    }

    toString() {
        return `Piece(${this.type} @ ${this.axialPosition.q},${this.axialPosition.r})`;
    }
}

export default Piece;