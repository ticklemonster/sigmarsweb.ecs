//
// creates and shuffles a bag of pieces, and
// hands them out until all have been used.
// 
import { PIECE_TYPES, METAL_TYPES } from './components';

const BOARD_LAYOUTS = [
    [ 
        [ 0, 0], [ 1,-1], [ 1, 0], [ 0, 1], [-1, 1], [-1, 0], [ 0,-1], [ 1,-2], 
        [ 2,-2], [ 2,-1], [ 2, 0], [ 1, 1], [ 0, 2], [-1, 2], [-2, 2], [-2, 1], 
        [-2, 0], [-1,-1], [ 0,-2], [ 1,-3], [ 2,-3], [ 3,-3], [ 3,-2], [ 3,-1], 
        [ 3, 0], [ 2, 1], [ 1, 2], [ 0, 3], [-1, 3], [-2, 3], [-3, 3], [-3, 2], 
        [-3, 1], [-3, 0], [-2,-1], [-1,-2], [ 0,-3], [ 2,-4], [ 3,-4], [ 4,-2], 
        [ 4,-1], [ 2, 2], [ 1, 3], [-2, 4], [-3, 4], [-4, 2], [-4, 1], [-2,-2], 
        [-1,-3], [ 3,-5], [ 5,-2], [ 2, 3], [-3, 5], [-5, 2], [-2,-3]
    ], [
        [ 0, 0], [ 1,-1], [ 1, 0], [ 0, 1], [-1, 1], [-1, 0], [ 0,-1], [ 1,-2], 
        [ 2,-2], [ 1, 1], [ 0, 2], [-2, 1], [-2, 0], [ 2,-3], [ 3,-2], [ 1, 2],
        [-1, 3], [-3, 1], [-2,-1], [ 3,-4], [ 4,-4], [ 4,-3], [ 4,-2], [ 1, 3],
        [ 0, 4], [-1, 4], [-2, 4], [-4, 1], [-4, 0], [-3,-1], [-2,-2], [ 5,-3],
        [ 5,-2], [ 5,-1], [ 5, 0], [ 4, 1], [ 3, 2], [ 2, 3], [ 1, 4], [-2, 5],
        [-3, 5], [-4, 5], [-5, 5], [-5, 4], [-5, 3], [-5, 2], [-5, 1], [-3,-2],
        [-2,-3], [-1,-4], [ 0,-5], [ 1,-5], [ 2,-5], [ 3,-5], [ 4,-5]
    ], [
        [ 0, 0], [ 2,-2], [ 2,-1], [ 2, 0], [ 1, 1], [ 0, 2], [-1, 2], [-2, 2],
        [-2, 1], [-2, 0], [-1,-1], [ 0,-2], [ 1,-2], [ 2,-3], [ 3,-3], [ 3,-1],
        [ 3, 0], [ 1, 2], [ 0, 3], [-2, 3], [-3, 3], [-3, 1], [-3, 0], [-1,-2],
        [ 0,-3], [ 4,-4], [ 4,-3], [ 4,-2], [ 4,-1], [ 4, 0], [ 3, 1], [ 2, 2],
        [ 1, 3], [ 0, 4], [-1, 4], [-2, 4], [-3, 4], [-4, 4], [-4, 3], [-4, 2],
        [-4, 1], [-4, 0], [-3,-1], [-2,-2], [-1,-3], [ 0,-4], [ 1,-4], [ 2,-4],
        [ 3,-4], [ 5,-5], [ 5, 0], [ 0, 5], [-5, 5], [-5, 0], [ 0,-5]
    ]
];



function LayoutGenerator() {
    this._layoutNum = undefined;
    this._pieces = [];

    return this;
}

LayoutGenerator.prototype.startLayout = function() {
    // create a new array of all pieces...
    this._pieces = [];
    this._layoutNum = (this._layoutNum === undefined) ? 0 : (this._layoutNum + 1) % BOARD_LAYOUTS.length;

    PIECE_TYPES.forEach((pieceType, index) => {
        for (let i = 0; i < pieceType.qty; i++) {
            this._pieces.push({
                index: index,
                type: pieceType.type,
                spriteId: pieceType.sprite,
                q: undefined, 
                r: undefined,
           });
        }
    })

    // Shuffle the pieces
    for (let i = this._pieces.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        [this._pieces[i], this._pieces[j]] = [this._pieces[j], this._pieces[i]];
    }

    // resplice the metals in reverse order
    const evenspacing = this._pieces.length/METAL_TYPES.length;
    for (let i = 0; i < METAL_TYPES.length; i++) {
        const idx = this._pieces.findIndex(e => e.type == METAL_TYPES[METAL_TYPES.length - 1 - i]);
        if (idx > -1) {
            const [metal] = this._pieces.splice(idx, 1);
            this._pieces.splice(i * evenspacing, 0, metal);
        }
    }

    // set the piece locations from the layout
    for (let i = 0; i < BOARD_LAYOUTS[this._layoutNum].length; i++) {
        [this._pieces[i].q, this._pieces[i].r] = BOARD_LAYOUTS[this._layoutNum][i];
    }

    // DEBUG - what did we just do?
    // console.debug(`LayoutGenerator.startLayout ${this._layoutNum}: `, this._pieces.map(p => `${p.type} @ ${p.q},${p.r}`));
}

LayoutGenerator.prototype.hasNextPiece = function() {
    return (this._pieces.length > 0);
}

LayoutGenerator.prototype.getNextPiece = function() {
    if (this._pieces.length == 0) {
        return null;
    }

    // get the next piece ...
    const p = this._pieces.shift();
    return p;
}

export default LayoutGenerator;
