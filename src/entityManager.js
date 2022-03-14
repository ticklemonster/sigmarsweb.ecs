//
// Entity Management
//
function EntityManager() {
    this.entities = [];

    this.clear = function() {
        // TODO: probably should clean up each of the components on the way
        this.entities = [];
    }

    this.addEntities = function(newentities) {
        newentities.forEach(e => console.debug(`[ add entity ${e.name}]`));
        this.entities = [ ...this.entities, ...newentities ];
    }

    this.removeEntities = function(rementities) {
        // "destroy" each component
        for (let e of rementities) {
            console.debug(`[ remove entity ${e.name}]`);
            for (let c of e.components) {
                if (c.destroy && typeof c.destroy == 'function') c.destroy();
            }
        }
    
        // remove the entities
        this.entities = this.entities.filter(e => !rementities.includes(e));
    }

    this.getEntitiesWithComponent = function(componentName) {
        return this.entities.filter(e => e.components.has(componentName));
    }

    this.getEntitiesWithComponentValue = function(componentName, propertyName, value) {
        return this.entities
            .filter(e => e.components.has(componentName))
            .filter(e => e.components.get(componentName)[propertyName] == value);
    }

    this.getComponent = function(entity, componentName) {
        if (this.entities.includes(entity) && entity.components.has(componentName)) {
            return entity.components.get(componentName);
        }
        return null;
    }



};

export default EntityManager;