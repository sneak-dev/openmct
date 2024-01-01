/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Promise*/

define(
    [],
    function () {
        "use strict";

        /**
         * The RegionController adds region data for a domain object's type
         * to the scope.
         *
         * @constructor
         */
        function RegionController($scope, policyService) {
            var domainObject = $scope.domainObject,
                typeCapability = domainObject.getCapability('type');

            /**
             * Filters region parts to only those allowed by region policies
             * @param regions
             * @returns {{}}
             */
            function filterParts(regions) {
                //Dupe so we're not modifying the type definition.
                var filteredRegions = {};
                Object.keys(regions).forEach(function(regionName) {
                    filteredRegions[regionName] = Object.create(regions[regionName]);
                    filteredRegions[regionName].parts = (regions[regionName].parts || []).filter(function(part){
                       return policyService.allow('region', part, domainObject);
                    });
                });
                return filteredRegions;
            }

            $scope.regions = filterParts(typeCapability.getDefinition().regions);
        }

        return RegionController;
    }
);