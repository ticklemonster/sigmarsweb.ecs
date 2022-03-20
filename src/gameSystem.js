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

GameSystem.prototype.update = function(t, entityManager) {
    // look for selectors that are complete
    const selectedEntities = entityManager.getEntitiesWithComponentValue('piece', 'selected', true);
    if (selectedEntities.length == 1) {
        const pieceType = entityManager.getEntityComponent(selectedEntities[0], 'piece').type;

        if (PIECE_TYPES.get(pieceType).matches.length == 0) {
            // Single selector (no match required)
            // console.debug(`  [ single selected - ${selectedEntities[0].name} ${pieceType} ]`);
            this.emit('UNSELECT', selectedEntities);
            this.emit('REMOVE', selectedEntities);
        }
    }
    else if (selectedEntities.length == 2) {
        const p0Type = entityManager.getEntityComponent(selectedEntities[0], 'piece').type;
        const p1Type = entityManager.getEntityComponent(selectedEntities[1], 'piece').type;

        if (PIECE_TYPES.get(p0Type).matches.includes(p1Type)) {
            // matching pair!
            // console.debug(`[ matching pair selected - ${selectedEntities[0].name}<->${selectedEntities[1].name} ]`);
            this.emit('UNSELECT', selectedEntities);
            this.emit('REMOVE', selectedEntities);
        } else {
            // non-matching pair => cancel the selection
            // console.debug(`[ no match - selection cancelled ]`);
            this.emit('UNSELECT', selectedEntities);
        }
        
    } else if (selectedEntities.length > 0) {
        // something is wrong - deselect everything.
        console.warn(`[ selection error - all selections cancelled ]`);
        this.emit('UNSELECT', selectedEntities);
    }
    

    // build a map of pieces indexed by location
    let pieces = new Map();
    entityManager.getEntitiesWithComponent('piece')
        .map(entity => entityManager.getEntityComponent(entity, 'piece'))
        .forEach(piece => {
            pieces.set(mapAxial(piece.position), piece);
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
    const metals = entityManager.getEntitiesWithComponent('piece')
        .map(entity => entityManager.getEntityComponent(entity, 'piece'))
        .filter(piece => METALS.includes(piece.type))
        .sort((a, b) => METALS.indexOf(a.type) - METALS.indexOf(b.type));
    // console.debug(`  - sorted METALS: ${metals.map(m => m.components.get('piece').type)}`)
    metals.shift();   // ignore the first metal
    metals.forEach(e => e.enabled = false); // only the lowest metal is selectable
}


GameSystem.prototype.getHint = function(entityManager) {
    const enabledEntities = entityManager.getEntitiesWithComponentValue('piece', 'enabled', true);

    let e2 = null;
    let e1 = enabledEntities.find(entity => {
        let p1 = entityManager.getEntityComponent(entity,'piece');
        let m1 = PIECE_TYPES.get(p1.type).matches;

        if (!m1 || m1.length == 0) return true;

        e2 = enabledEntities.find(e => (
            e !== entity && m1.includes(entityManager.getEntityComponent(e,'piece').type)
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

export default GameSystem;
