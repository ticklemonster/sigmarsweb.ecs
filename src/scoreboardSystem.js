import { PIECE_TYPES } from './constants';

function ScoreboardSystem() {
    return this;
}

ScoreboardSystem.prototype.createEntities = function(entities) {
    if (!entities) return;

    // remove all existing "score" items
    let i = -1;
    while ((i = entities.indexOf(e => e.components.has('score'))) > -1) {
        entities.splice(i, 1);
    }

    // add new "score" items
    for (let pt of PIECE_TYPES.keys()) { 
        entities.push({
            name: `score for ${pt}`,
            components: new Map([
                ['score', { 
                    type: pt,
                    value: 0,
                }]
            ])
        })
    }

}

ScoreboardSystem.prototype.update = function(t, entities) {
    const pieces = entities.filter(e => e.components.has('piece')).map(e => e.components.get('piece'));
    const scores = entities.filter(e => e.components.has('score'));
    for (let pieceType of PIECE_TYPES.keys()) {
        // update the score only if there is a matching entity
        const scoreEntity = scores.find(e => e.components.get('score').type == pieceType);
        if (scoreEntity) {
            // count the pieces...
            const pieceCount = pieces.filter(p => p.type == pieceType).length
            scoreEntity.components.get('score').value = pieceCount;
        }
    }

    // console.debug(`SCOREBOARD: `, entities.filter(e => e.components.has('score')).map(e => e.components.get('score')));
}

export default ScoreboardSystem;