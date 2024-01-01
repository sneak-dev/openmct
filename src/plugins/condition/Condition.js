/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import * as EventEmitter from 'eventemitter3';
import uuid from 'uuid';
import TelemetryCriterion from "@/plugins/condition/criterion/TelemetryCriterion";
import { TRIGGER } from "@/plugins/condition/utils/constants";
import {computeCondition} from "@/plugins/condition/utils/evaluator";

/*
* conditionConfiguration = {
*   identifier: {
*       key: '',
*       namespace: ''
*   },
*   trigger: 'any'/'all',
*   criteria: [
*       {
*           operation: '',
*           input: '',
*           metaDataKey: '',
*           key: 'someTelemetryObjectKey'
*       }
*   ]
* }
*/
export default class ConditionClass extends EventEmitter {

    /**
     * Manages criteria and emits the result of - true or false - based on criteria evaluated.
     * @constructor
     * @param conditionConfiguration: {identifier: {domainObject.identifier},trigger: enum, criteria: Array of {id: uuid, operation: enum, input: Array, metaDataKey: string, key: {domainObject.identifier} }
     * @param openmct
     */
    constructor(conditionConfiguration, openmct) {
        super();

        this.openmct = openmct;
        this.id = this.openmct.objects.makeKeyString(conditionConfiguration.identifier);
        this.criteria = [];
        this.criteriaResults = {};
        if (conditionConfiguration.configuration.criteria) {
            this.createCriteria(conditionConfiguration.configuration.criteria);
        }
        this.trigger = conditionConfiguration.configuration.trigger;
        this.result = null;
        this.openmct.objects.get(this.id).then(obj => this.observeForChanges(obj));
    }

    observeForChanges(conditionDO) {
        this.stopObservingForChanges = this.openmct.objects.observe(conditionDO, '*', this.update.bind(this));
    }

    update(newDomainObject) {
        this.updateTrigger(newDomainObject.configuration.trigger);
        this.updateCriteria(newDomainObject.configuration.criteria);
    }

    updateTrigger(trigger) {
        if (this.trigger !== trigger) {
            this.trigger = trigger;
            this.handleConditionUpdated();
        }
    }

    generateCriterion(criterionConfiguration) {
        return {
            id: uuid(),
            operation: criterionConfiguration.operation || '',
            input: criterionConfiguration.input === undefined ? [] : criterionConfiguration.input,
            metaDataKey: criterionConfiguration.metaDataKey || '',
            key: criterionConfiguration.key || ''
        };
    }

    createCriteria(criterionConfigurations) {
        criterionConfigurations.forEach((criterionConfigurations) => {
            this.addCriterion(criterionConfigurations);
        });
    }

    updateCriteria(criterionConfigurations) {
        this.destroyCriteria();
        this.createCriteria(criterionConfigurations);
    }

    /**
     *  adds criterion to the condition.
     */
    addCriterion(criterionConfiguration) {
        let criterionConfigurationWithId = this.generateCriterion(criterionConfiguration || null);
        let criterion = new TelemetryCriterion(criterionConfigurationWithId, this.openmct);
        criterion.on('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
        criterion.on('criterionResultUpdated', (obj) => this.handleCriterionResult(obj));
        if (!this.criteria) {
            this.criteria = [];
        }
        this.criteria.push(criterion);
        //Do we need this here?
        this.handleConditionUpdated();
        return criterionConfigurationWithId.id;
    }

    findCriterion(id) {
        let criterion;

        for (let i=0, ii=this.criteria.length; i < ii; i ++) {
            if (this.criteria[i].id === id) {
                criterion = {
                    item: this.criteria[i],
                    index: i
                }
            }
        }

        return criterion;
    }

    updateCriterion(id, criterionConfiguration) {
        let found = this.findCriterion(id);
        if (found) {
            const newcriterionConfiguration = this.generateCriterion(criterionConfiguration);
            let newCriterion = new TelemetryCriterion(newcriterionConfiguration, this.openmct);
            newCriterion.on('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
            newCriterion.on('criterionResultUpdated', (obj) => this.handleCriterionResult(obj));

            let criterion = found.item;
            criterion.unsubscribe();
            criterion.off('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
            criterion.off('criterionResultUpdated', (obj) => this.handleCriterionResult(obj));
            this.criteria.splice(found.index, 1, newCriterion);
            if (this.criteriaResults[criterion.id] !== undefined) {
                delete this.criteriaResults[criterion.id];
            }
            this.handleConditionUpdated();
        }
    }

    removeCriterion(id) {
        if (this.destroyCriterion(id)) {
            this.handleConditionUpdated();
        }
    }

    destroyCriterion(id) {
        let found = this.findCriterion(id);
        if (found) {
            let criterion = found.item;
            criterion.destroy();
            criterion.off('criterionUpdated', (result) => {
                this.handleCriterionUpdated(id, result);
            });
            this.criteria.splice(found.index, 1);
            if (this.criteriaResults[criterion.id] !== undefined) {
                delete this.criteriaResults[criterion.id];
            }
            return true;
        }
        return false;
    }

    handleCriterionUpdated(criterion) {
        let found = this.findCriterion(criterion.id);
        if (found) {
            this.criteria[found.index] = criterion.data;
            //Most likely don't need this.
            this.subscribe();
            this.emitEvent('conditionUpdated', {
                trigger: this.trigger,
                criteria: this.criteria
            });
        }
    }

    handleCriterionResult(eventData) {
        let id = eventData.id;
        let result = eventData.data.result;
        let found = this.findCriterion(id);
        if (found) {
            this.criteriaResults[id] = result;
        }
        this.handleConditionUpdated();
    }

    subscribe() {
        this.criteria.forEach((criterion) => {
            criterion.subscribe();
        })
    }

    handleConditionUpdated() {
        // trigger an updated event so that consumers can react accordingly
        this.evaluate();
        this.emitEvent('conditionResultUpdated', {result: this.result});
    }

    getCriteria() {
        return this.criteria;
    }

    destroyCriteria() {
        let success = true;
        //looping through the array backwards since destroyCriterion modifies the criteria array
        for (let i=this.criteria.length-1; i >= 0; i--) {
            success = success && this.destroyCriterion(this.criteria[i].id);
        }
        return success;
    }

    //TODO: implement as part of the evaluator class task.
    evaluate() {
        this.result = computeCondition(this.criteriaResults, this.trigger === TRIGGER.ALL);
    }

    emitEvent(eventName, data) {
        this.emit(eventName, {
            id: this.id,
            data: data
        });
    }

    destroy() {
        if (typeof this.stopObservingForChanges === 'function') {
            this.stopObservingForChanges();
        }
        this.destroyCriteria();
    }
}
