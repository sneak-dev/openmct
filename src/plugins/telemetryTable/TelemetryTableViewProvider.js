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
    './components/table.vue',
    '../../exporters/CSVExporter',
    './TelemetryTable',
    'vue'
], function (
    TableComponent,
    CSVExporter,
    TelemetryTable,
    Vue
) {
    function TelemetryTableViewProvider(openmct) {
        return {
            key: 'table',
            name: 'Telemetry Table',
            cssClass: 'icon-tabular-realtime',
            canView(domainObject) {
                return domainObject.type === 'table' || domainObject.hasOwnProperty('telemetry');
            },
            canEdit(domainObject) {
                return domainObject.type === 'table';
            },
            view(domainObject) {
                let csvExporter = new CSVExporter.default();
                let table = new TelemetryTable(domainObject, openmct);
                let component;
                return {
                    show: function (element) {
                        component = new Vue({
                            components: {
                                TableComponent: TableComponent.default,
                            },
                            provide: {
                                openmct,
                                csvExporter,
                                table
                            },
                            el: element,
                            template: '<table-component></table-component>'
                        });
                    },
                    destroy: function (element) {
                        component.$destroy();
                        component = undefined;
                    }
                }
            },
            priority() {
                return 1;
            }
        }
    }
    return TelemetryTableViewProvider;
});
