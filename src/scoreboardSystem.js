import { PIECE_TYPES } from './constants';

function ScoreboardSystem() {
    return this;
}

ScoreboardSystem.prototype.createEntities = function() {
    const scoreEntities = [];

    // add new "score" items
    for (let pt of PIECE_TYPES.keys()) { 
        scoreEntities.push({
            name: `score for ${pt}`,
            score: { type: pt, value: 0 }
        })
    }

    return scoreEntities;
}

ScoreboardSystem.prototype.update = function(t, entityManager) {
    const pieces = entityManager.getEntitiesWithComponent('piece')
        .map(e => entityManager.getEntityComponent(e, 'piece'));
    const scores = entityManager.getEntitiesWithComponent('score')
        .map(e => entityManager.getEntityComponent(e, 'score'));

    for (let pieceType of PIECE_TYPES.keys()) {
        // update the score only if there is a matching entity
        const scoreComp = scores.find(score => score.type == pieceType);
        if (scoreComp) {
            // count the pieces...
            const pieceCount = pieces.filter(p => p.type == pieceType).length
            scoreComp.value = pieceCount;
        }
    }

    // console.debug(`SCOREBOARD: `, entities.filter(e => e.components.has('score')).map(e => e.components.get('score')));
}

export default ScoreboardSystem;
