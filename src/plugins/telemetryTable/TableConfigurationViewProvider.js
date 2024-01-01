/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define([
    '../../api/objects/object-utils',
    './components/table-configuration.vue',
    './TelemetryTableConfiguration',
    'vue'
], function (
    objectUtils,
    TableConfigurationComponent,
    TelemetryTableConfiguration,
    Vue
) {

    function TableConfigurationViewProvider(openmct) {
        let instantiateService;

        function isBeingEdited(object) {
            let oldStyleObject = getOldStyleObject(object);

            return oldStyleObject.hasCapability('editor') &&
                oldStyleObject.getCapability('editor').inEditContext();
        }

        function getOldStyleObject(object) {
            let oldFormatModel = objectUtils.toOldFormat(object);
            let oldFormatId = objectUtils.makeKeyString(object.identifier);

            return instantiate(oldFormatModel, oldFormatId);
        }

        function instantiate(model, id) {
            if (!instantiateService) {
                instantiateService = openmct.$injector.get('instantiate');
            }
            return instantiateService(model, id);
        }


        return {
            key: 'table-configuration',
            name: 'Telemetry Table Configuration',
            canView: function (selection) {
                if (selection.length === 0) {
                    return false;
                }
                let object = selection[0].context.item;
                return object.type === 'table' &&
                    isBeingEdited(object);
            },
            view: function (selection) {
                let component;
                let domainObject = selection[0].context.item;
                const tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct);
                return {
                    show: function (element) {
                        component = new Vue({
                            provide: {
                                openmct,
                                tableConfiguration
                            },
                            components: {
                                TableConfiguration: TableConfigurationComponent.default
                            },
                            template: '<table-configuration></table-configuration>',
                            el: element
                        });
                    },
                    destroy: function (element) {
                        component.$destroy();
                        component = undefined;
                    }
                }
            },
            priority: function () {
                return 1;
            }
        }
    }
    return TableConfigurationViewProvider;
});
