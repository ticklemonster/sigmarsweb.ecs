//
// Entity Management
//
// Each entity is a plain Javascript object.
// The entity manager controls and array of entities (i.e. Array of Objects).
//
function EntityManager() {
    this.entities = [];
    return this;
}

EntityManager.prototype.clear = function() {
        // TODO: probably should clean up each of the components on the way
        this.entities = [];
    }

EntityManager.prototype.addEntities = function(toAdd) {
    if (!Array.prototype.isPrototypeOf(toAdd)) return;

    // toAdd.forEach(e => console.debug(`[ add entity ${e.name}]`));
    this.entities = [ ...this.entities, ...toAdd ];
}

EntityManager.prototype.removeEntities = function(toRemove, shouldDestroy = true) {
    if (!Array.prototype.isPrototypeOf(toRemove)) return;
    
    // "destroy" each component
    if (shouldDestroy) {
        toRemove.forEach(e => {
            Object.getOwnPropertyNames(e).forEach(c => {
                if (c.destroy && typeof c.destroy == 'function') c.destroy();
            })
        });
    }

    // remove the entities
    this.entities = this.entities.filter(e => !toRemove.includes(e));
}

// return all entities with a component of the specified name
EntityManager.prototype.getEntitiesWithComponent = function(cname) {
    return this.entities.filter(e =>
        e.hasOwnProperty(cname)
    );
}

// return all entities with a sepcified component that has a matching property value
EntityManager.prototype.getEntitiesWithComponentValue = function(cname, pname, pvalue) {
    return this.entities.filter(e => 
        e.hasOwnProperty(cname) && e[cname].hasOwnProperty(pname) && e[cname][pname] === pvalue
    );
}

// return all entities that have any component with a matching property name and value
EntityManager.prototype.getEntitiesWithPropertyValue = function(pname, pvalue) {
    return this.entities.filter(e => 
        Object.getOwnPropertyNames(e).find(c => 
            (e[c].hasOwnProperty(pname) && e[c][pname] === pvalue)
        )
    );
}


// get a component (by name)
EntityManager.prototype.getEntityComponent = function(e, c) {
    return (e && e.hasOwnProperty(c)) ? e[c] : undefined;
}

// set a component
EntityManager.prototype.setEntityComponent = function(e, c, obj) {
    if (!e) return;

    // if there is an existing property, then merge values
    if (e.hasOwnProperty(c)) {
        e[c] = { ...e[c], ...obj }
    }

    // otherwise create a new one
    else {
        e[c] = obj;
    }
}

EntityManager.prototype.removeEntityComponent = function(entity, component) {
    if (!entity || !entity.hasOwnProperty(component)) return;

    delete entity[component];
}


// // EntityManager.prototype.createEntity = function(name, type) {
// //     return {
// //         "name": name,
// //         "type": type,
// //         "components": []
// //     }
// // }

// // EntityManager.prototype.addComponent = function(entity, type, object) {
// //     if (!entity.name || !entity.type) { 
// //         return null;
// //     }

// //     if (!entity.components) entity.components = [];
// //     const component = { ...object, "type": type };
// //     entity.components = [ ...entity.components, component ];

// //     return entity;
// // }

export default EntityManager;