import { EventEmitter } from "@pixi/utils";
import { AXIAL_VECTORS, PIECE_TYPES, METALS } from "./constants";

function mapAxial(a) {
    return mapAxialQR(a.q, a.r);
}
function mapAxialQR(q, r) {
    return `${q}|${r}`;
}

function GameSystem() {
    EventEmitter.call(this);

    return this;
}

GameSystem.prototype = Object.create(EventEmitter.prototype);
// GameSystem.prototype.constructor = GameSystem;

GameSystem.prototype.update = function(t, entities) {
    // look for selectors that are complete
    const selectedEntities = entities.filter(e => e.components.has('piece') && e.components.get('piece').selected);
    if (selectedEntities.length == 1) {
        const pieceType = selectedEntities[0].components.get('piece').type;

        if (PIECE_TYPES.get(pieceType).matches.length == 0) {
            // Single selector (no match required)
            console.debug(`  [ single selected - ${selectedEntities[0].name} ${pieceType} ]`);
            this.emit('UNSELECT', selectedEntities);
            this.emit('REMOVE', selectedEntities);
        }
    }
    else if (selectedEntities.length == 2) {
        const p0Type = selectedEntities[0].components.get('piece').type;
        const p1Type = selectedEntities[1].components.get('piece').type;

        if (PIECE_TYPES.get(p0Type).matches.includes(p1Type)) {
            // matching pair!
            console.debug(`[ matching pair selected - ${selectedEntities[0].name}<->${selectedEntities[1].name} ]`);
            this.emit('UNSELECT', selectedEntities);
            this.emit('REMOVE', selectedEntities);
        } else {
            // non-matching pair => cancel the selection
            console.debug(`[ no match - selection cancelled ]`);
            this.emit('UNSELECT', selectedEntities);
        }
        
    } else if (selectedEntities.length > 0) {
        // something is wrong - deselect everything.
        console.warn(`[ selection error - all selections cancelled ]`);
        this.emit('UNSELECT', selectedEntities);
    }
    

    // build a map of pieces indexed by location
    let pieces = new Map();
    entities
        .filter(e => e.components.has('piece'))
        .forEach(e => {
            pieces.set(mapAxial(e.components.get('piece').position), e.components.get('piece'));
        });
    // allow selection based on location...
    for(let [key, piece] of pieces) {
        const pos = piece.position;
        let adj = [
            pieces.has(mapAxialQR(pos.q + AXIAL_VECTORS[0][0], pos.r + AXIAL_VECTORS[0][1])),
            pieces.has(mapAxialQR(pos.q + AXIAL_VECTORS[1][0], pos.r + AXIAL_VECTORS[1][1])),
            pieces.has(mapAxialQR(pos.q + AXIAL_VECTORS[2][0], pos.r + AXIAL_VECTORS[2][1])),
            pieces.has(mapAxialQR(pos.q + AXIAL_VECTORS[3][0], pos.r + AXIAL_VECTORS[3][1])),
            pieces.has(mapAxialQR(pos.q + AXIAL_VECTORS[4][0], pos.r + AXIAL_VECTORS[4][1])),
            pieces.has(mapAxialQR(pos.q + AXIAL_VECTORS[5][0], pos.r + AXIAL_VECTORS[5][1])),
        ];
        
        if ((!adj[0] && !adj[1] && !adj[2]) || (!adj[1] && !adj[2] && !adj[3]) ||
            (!adj[2] && !adj[3] && !adj[4]) || (!adj[3] && !adj[4] && !adj[5]) ||
            (!adj[4] && !adj[5] && !adj[0]) || (!adj[5] && !adj[0] && !adj[1])) {
            // This piece has at least three in a row with nothing
            piece.enabled = true;
        }
        else {
            piece.enabled = false;
        }
    }

    // restrict selection of metals based on others
    const metals = entities
        .filter(e => e.components.has('piece') && METALS.includes(e.components.get('piece').type))
        .sort((a, b) => METALS.indexOf(a.components.get('piece').type) - METALS.indexOf(b.components.get('piece').type));
    // console.debug(`  - sorted METALS: ${metals.map(m => m.components.get('piece').type)}`)
    metals.shift();   // ignore the first metal
    metals.forEach(e => e.components.get('piece').enabled = false); // only the lowest metal is selectable
}


export default GameSystem;
