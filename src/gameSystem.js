import { AXIAL_VECTORS, PIECE_TYPES, METALS } from "./constants";

function mapAxial(a) {
    return mapAxialQR(a.q, a.r);
}
function mapAxialQR(q, r) {
    return `${q}|${r}`;
}

function GameSystem() {
    console.debug(this);
    return this;
}

GameSystem.prototype.update = function(t, entities) {
    // look for selectors that are complete
    const selectedEntities = entities.filter(e => e.components.has('piece') && e.components.get('piece').selected);
    if (selectedEntities.length == 1) {
        const pieceType = selectedEntities[0].components.get('piece').type;

        if (PIECE_TYPES.get(pieceType).matches.length == 0) {
            // Single selector (no match required)
            console.debug(`  [ single selected - ${selectedEntities[0].name} ${pieceType} ]`);

            // remove any selector and this entity
            removeSelectorFrom(selectedEntities[0], entities);
            removeEntityFrom(selectedEntities[0], entities);
        }
    }
    else if (selectedEntities.length == 2) {
        const p0Type = selectedEntities[0].components.get('piece').type;
        const p1Type = selectedEntities[1].components.get('piece').type;

        if (PIECE_TYPES.get(p0Type).matches.includes(p1Type)) {
            // matching pair!
            console.debug(`[ matching pair selected - ${selectedEntities[0].name}<->${selectedEntities[1].name} ]`);

            // remove entities and selectors
            removeSelectorFrom(selectedEntities[0], entities);
            removeEntityFrom(selectedEntities[0], entities);
            removeSelectorFrom(selectedEntities[1], entities);
            removeEntityFrom(selectedEntities[1], entities);
        } else {
            // non-matching pair => cancel the selection
            console.debug(`[ no match - selection cancelled ]`);
            
            selectedEntities[0].components.get('piece').selected = false;
            removeSelectorFrom(selectedEntities[0], entities);
            selectedEntities[1].components.get('piece').selected = false;
            removeSelectorFrom(selectedEntities[1], entities);
        }
        
    } else if (selectedEntities.length > 0) {
        // something is wrong - deselect everything.
        console.warn(`[ selection error - all selections cancelled ]`);
        for (let e of selectedEntities) {
            e.components.get('piece').selected = false;
            removeSelectorFrom(e, entities);
        }
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

//
// toggle selection of an entity - and manage creating / removal of selectors
//
GameSystem.prototype.toggleSelect = function(entity, entities) {
    if (entity || entity.components.has('piece')) {
        const p = entity.components.get('piece');
        p.selected = !p.selected;
        
        if (p.selected) {
            console.debug(`  [ select piece ${entity.name}]`);
            entities.push(newSelectorEntityFor(entity));
        } else {
            console.debug(`  [ unselect piece ${entity.name}]`);
            removeSelectorFrom(entity, entities);
        }
    }
}

export default GameSystem;


//
// internal functions
//
function newSelectorEntityFor(other) {
    const entity = {
        name: 'selector for ' + other.name,
        components: new Map([
            ['selector', {
                'entity': other,
            }],
        ])
    }

    return entity;
}

function destroyEntityComponents(entity) {
    entity.components.forEach(c => {
        if (c.destroy && typeof(c.destroy) === 'function') {
            c.destroy();
        }
    })
}

function removeSelectorFrom(entity, entities) {
    let i = -1;
    while ((i = entities.findIndex(e => e.components.has('selector') && e.components.get('selector').entity == entity)) > -1) {
        destroyEntityComponents(entities[i]);
        entities.splice(i, 1);
    }
}

function removeEntityFrom(entity, entities) {
    const i = entities.findIndex(e => e == entity);
    if (i > -1) {
        destroyEntityComponents(entity);
        entities.splice(i, 1);
    }
}