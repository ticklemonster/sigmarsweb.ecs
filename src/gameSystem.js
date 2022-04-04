import { EventEmitter } from "@pixi/utils";
import { defineQuery, enterQuery, exitQuery, hasComponent, addEntity, removeEntity, addComponent } from "bitecs";
import { AxialPosition, Displayable, Piece, PIECE_STATES, PIECE_TYPES, METAL_TYPES } from "./components";

const AXIAL_VECTORS = [
    {q: +1, r: 0}, {q: +1, r: -1}, {q: 0, r: -1}, 
    {q: -1, r: 0}, {q: -1, r: +1}, {q: 0, r: +1},
];

const mapqr = function(q, r) {
    return `${q},${r}`;
}

const pieceQuery = defineQuery([Piece, AxialPosition]);
const enterPieceQuery = enterQuery(pieceQuery);
const exitPieceQuery  = exitQuery(pieceQuery);

function GameSystem() {
    EventEmitter.call(this);

    this.init();

    return this;
}

GameSystem.prototype = Object.create(EventEmitter.prototype);

GameSystem.prototype.init = function() {
    console.debug(`GameSystem.init`);
    this._pieceMap = new Map();
}

GameSystem.prototype.clear = function(world) {
    pieceQuery(world).forEach(e => removeEntity(world, e));
    this._pieceMap = new Map();
}

GameSystem.prototype.addPiece = function(world, piece) {
    if (!piece) return;

    const eid = addEntity(world);
    addComponent(world, AxialPosition, eid);
    addComponent(world, Piece, eid);
    addComponent(world, Displayable, eid);
    
    AxialPosition.q[eid] = piece.q || 0;
    AxialPosition.r[eid] = piece.r || 0;
    Piece.state[eid] = PIECE_STATES.NONE;
    Piece.typeId[eid] = piece.index || undefined;
    Displayable.spriteId[eid] = piece.spriteId || undefined;

    return eid;
}

const GAME_OVER_EVENT = 'GAME_OVER';
const REMOVE_EVENT = 'REMOVE';
GameSystem.prototype.update = function(world) {
    let isDirty = false;

    // remove old entries from the map
    exitPieceQuery(world).forEach(id => {
        this._pieceMap.delete(mapqr(AxialPosition.q[id], AxialPosition.r[id]));
        isDirty = true;
    });

    // add new pieces to the map
    enterPieceQuery(world).forEach(id => {
        console.debug(`New Piece: ${id} ${AxialPosition.q[id]},${AxialPosition.r[id]} ${PIECE_TYPES[Piece.typeId[id]].type}`);
        this._pieceMap.set(mapqr(AxialPosition.q[id],  AxialPosition.r[id]), id);

        console.assert(this._pieceMap.get(mapqr(AxialPosition.q[id], AxialPosition.r[id])) == id, 'Value was not saved!');
        isDirty = true;
    });
    
    // Look for selectors that are complete
    let selectedEntities = [];
    pieceQuery(world).forEach(id => {
        if (Piece.state[id] & PIECE_STATES.SELECTED) {
            selectedEntities.push(id);
        }
    });
    if (selectedEntities.length == 1) {
        const pieceTypeId = Piece.typeId[selectedEntities[0]];

        if (PIECE_TYPES[pieceTypeId].matches.length == 0) {
            // Single selector (no match required)
            console.debug(`  [ single selected - ${PIECE_TYPES[pieceTypeId].type} ]`);
            
            Piece.state[selectedEntities[0]] &= (~PIECE_STATES.SELECTED);
            this.emit(REMOVE_EVENT, selectedEntities);
        }
    }
    else if (selectedEntities.length == 2) {
        const p0TypeId = Piece.typeId[selectedEntities[0]];
        const p1TypeId = Piece.typeId[selectedEntities[1]];

        if (PIECE_TYPES[p0TypeId].matches.includes(PIECE_TYPES[p1TypeId].type)) {
            // matching pair!
            selectedEntities.forEach(id => Piece.state[id] &= (~PIECE_STATES.SELECTED));
            console.debug(`[ matching pair selected - ${PIECE_TYPES[p0TypeId].type}<->${PIECE_TYPES[p1TypeId].type} ]`);
            this.emit(REMOVE_EVENT, selectedEntities);
        } else {
            // non-matching pair => cancel the selection
            // console.debug(`[ no match - selection cancelled ]`);
            selectedEntities.forEach(id => Piece.state[id] &= (~PIECE_STATES.SELECTED));
        }
        
    } else if (selectedEntities.length > 0) {
        // something is wrong - deselect everything.
        console.warn(`[ selection error - all selections cancelled ]`);
        selectedEntities.forEach(id => Piece.state[id] &= (~PIECE_STATES.SELECTED));
    }
    
    // update piece selectiability if there has been a layout change
    if (isDirty) {
        // console.debug('Game map has changed - check');
        
        // Check by adjacent
        for(let id of this._pieceMap.values()) {
            let q = AxialPosition.q[id];
            let r = AxialPosition.r[id];
            let adj = [
                this._pieceMap.has(mapqr((q + AXIAL_VECTORS[0].q), (r + AXIAL_VECTORS[0].r))),
                this._pieceMap.has(mapqr((q + AXIAL_VECTORS[1].q), (r + AXIAL_VECTORS[1].r))),
                this._pieceMap.has(mapqr((q + AXIAL_VECTORS[2].q), (r + AXIAL_VECTORS[2].r))),
                this._pieceMap.has(mapqr((q + AXIAL_VECTORS[3].q), (r + AXIAL_VECTORS[3].r))),
                this._pieceMap.has(mapqr((q + AXIAL_VECTORS[4].q), (r + AXIAL_VECTORS[4].r))),
                this._pieceMap.has(mapqr((q + AXIAL_VECTORS[5].q), (r + AXIAL_VECTORS[5].r))),
            ];
            // console.debug(`  ${q},${r} ${adj}`);
            
            if ((!adj[0] && !adj[1] && !adj[2]) || (!adj[1] && !adj[2] && !adj[3]) ||
                (!adj[2] && !adj[3] && !adj[4]) || (!adj[3] && !adj[4] && !adj[5]) ||
                (!adj[4] && !adj[5] && !adj[0]) || (!adj[5] && !adj[0] && !adj[1])) {
                // This piece has at least three in a row with nothing
                Piece.state[id] |= PIECE_STATES.ENABLED;
            }
            else {
                Piece.state[id] &= (~PIECE_STATES.ENABLED);
            }

        }

        // restrict selection of metals based on others
        let metalIds = [];
        for (let id of this._pieceMap.values()) {
            if (METAL_TYPES.indexOf(PIECE_TYPES[Piece.typeId[id]].type) >= 0) metalIds.push(id);
        }
        metalIds.sort((a, b) => METAL_TYPES.indexOf(PIECE_TYPES[Piece.typeId[a]].type) - METAL_TYPES.indexOf(PIECE_TYPES[Piece.typeId[b]].type))
        metalIds.shift(); // ignore the first item
        metalIds.forEach(id => Piece.state[id] &= (~PIECE_STATES.ENABLED));

    }

    if (pieceQuery(world).length == 0) {
        this.emit(GAME_OVER_EVENT, true);
    }
}

GameSystem.prototype.selectEntity = function(world, id, shouldSelect) {
    if (hasComponent(world, Piece, id)) {
        if (shouldSelect === true) {
            Piece.state[id] |= PIECE_STATES.SELECTED;
        }
        else if (shouldSelect === false) {
            Piece.state[id] &= (~PIECE_STATES.SELECTED);
        } else {
            Piece.state[id] ^= PIECE_STATES.SELECTED;
        }
    }
}

GameSystem.prototype.clearSelections = function(world) {
    pieceQuery(world).forEach(id => {
        if (Piece.state[id] & PIECE_STATES.SELECTED)
            Piece.state[id] &= (~PIECE_STATES.SELECTED);
    });
}

GameSystem.prototype.getHint = function(world) {
    const enabledEntities = pieceQuery(world).filter(id =>
        Piece.state[id] &= PIECE_STATES.ENABLED
    );

    let e2 = null;
    let e1 = enabledEntities.find(eid => {
        let p1 = Piece.typeId[eid];
        let m1 = PIECE_TYPES[p1].matches;

        if (!m1 || m1.length == 0) return true;

        e2 = enabledEntities.find(eid2 => (
            eid2 !== eid && m1.includes(PIECE_TYPES[Piece.typeId[eid2]].type)
        ));
        if (e2 !== null && e2 !== undefined) {
            return true;
        }

        return false;
    });

    if (e1 !== null && e1 !== undefined) {
        return [e1, e2];
    }
    return [];
}

export { GAME_OVER_EVENT, REMOVE_EVENT };
export default GameSystem;
