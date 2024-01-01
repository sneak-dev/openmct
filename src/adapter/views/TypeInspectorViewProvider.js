define([

], function (

) {
    const DEFAULT_VIEW_PRIORITY = 100;

    const PRIORITY_LEVELS = {
        "fallback": Number.NEGATIVE_INFINITY,
        "default": -100,
        "none": 0,
        "optional": DEFAULT_VIEW_PRIORITY,
        "preferred": 1000,
        "mandatory": Number.POSITIVE_INFINITY
    };

    function TypeInspectorViewProvider(typeDefinition, openmct, convertToLegacyObject) {
        console.warn(`DEPRECATION WARNING: Migrate ${typeDefinition.key} from ${typeDefinition.bundle.path} to use the new Inspector View APIs.  Legacy Inspector view support will be removed soon.`);
        let representation = openmct.$injector.get('representations[]')
            .filter((r) => r.key === typeDefinition.inspector)[0];

        return {
            key: representation.key,
            name: representation.name,
            cssClass: representation.cssClass,
            description: representation.description,
            canView: function (selection) {
                if (!selection[0] || !selection[0].context.item) {
                    return false;
                }
                let domainObject = selection[0].context.item;
                return domainObject.type === typeDefinition.key;
            },
            view: function (selection) {
                let domainObject = selection[0].context.item;
                let $rootScope = openmct.$injector.get('$rootScope');
                let templateLinker = openmct.$injector.get('templateLinker');
                let scope = $rootScope.$new();
                let legacyObject = convertToLegacyObject(domainObject);
                let isDestroyed = false;
                scope.domainObject = legacyObject;
                scope.model = legacyObject.getModel();


                return {
                    show: function (container) {
                        // TODO: implement "gestures" support ?
                        let uses = representation.uses || [];
                        let promises = [];
                        let results = uses.map(function (capabilityKey, i) {
                            let result = legacyObject.useCapability(capabilityKey);
                            if (result.then) {
                                promises.push(result.then(function (r) {
                                    results[i] = r;
                                }));
                            }
                            return result;
                        });

                        function link() {
                            if (isDestroyed) {
                                return;
                            }
                            uses.forEach(function (key, i) {
                                scope[key] = results[i];
                            });
                            templateLinker.link(
                                scope,
                                openmct.$angular.element(container),
                                representation
                            );
                            container.style.height = '100%';
                        }

                        if (promises.length) {
                            Promise.all(promises)
                                .then(function () {
                                    link();
                                    scope.$digest();
                                });
                        } else {
                            link();
                        }
                    },
                    destroy: function () {
                        scope.$destroy();
                    }
                }
            }
        };
    };

    return TypeInspectorViewProvider;

});
