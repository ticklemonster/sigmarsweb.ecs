//
// creates and shuffles a bag of pieces, and
// hands out entities until all have been used.
// 
import { PIECE_TYPES, METALS, BOARD_LAYOUTS } from './constants';

function LayoutGenerator() {
    this._layoutNum = undefined;
    this._pieces = [];

    return this;
}

LayoutGenerator.prototype.startLayout = function() {
    // create a new array of all pieces...
    this._pieces = [];
    this._layoutNum = (this._layoutNum === undefined) ? 0 : (this._layoutNum + 1) % BOARD_LAYOUTS.length;

    for (const [t, v] of PIECE_TYPES) {
        for (let i = 0; i < v.qty; i++) {
            this._pieces.push({
                components: new Map([
                    ['piece', {
                        type: t,
                        enabled: false,
                        position: { q: undefined, r: undefined },
                    }]
                ])
            });
        }
    }

    // Shuffle the pieces
    for (let i = this._pieces.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        [this._pieces[i], this._pieces[j]] = [this._pieces[j], this._pieces[i]];
    }

    // insert the metals in reverse order
    const evenspacing = this._pieces.length/METALS.length;
    for (let i = 0; i < METALS.length; i++) {
        const idx = this._pieces.findIndex(e => e.components.get('piece').type == METALS[METALS.length - 1 - i]);
        if (idx > -1) {
            const [metal] = this._pieces.splice(idx, 1);
            this._pieces.splice(i * evenspacing, 0, metal);
        }
    }

    // set the piece locations from the layout
    for (let i = 0; i < BOARD_LAYOUTS[this._layoutNum].length; i++) {
        const [q, r] = BOARD_LAYOUTS[this._layoutNum][i];
        this._pieces[i].components.get('piece').position = { q, r };
        this._pieces[i].name = `${this._pieces[i].components.get('piece').type}@${q},${r}`;

    }

    // DEBUG - what did we just do?
    console.debug(`LayoutGenerator.startLayout ${this._layoutNum}: `, this._pieces.map(p => p.components.get('piece').type).join(','));
}

LayoutGenerator.prototype.nextEntity = function() {
    if (this._pieces.length == 0) {
        return null;
    }

    // get the next entity ...
    const entity = this._pieces.shift();
    // console.debug(`LayoutGenerator.nextEntity: ${entity.name}`);

    return entity;
}

export default LayoutGenerator;
