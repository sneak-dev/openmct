/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
    './actions/ActionsAPI',
    './composition/CompositionAPI',
    './Editor',
    './forms/FormsAPI',
    './indicators/IndicatorAPI',
    './menu/MenuAPI',
    './notifications/NotificationAPI',
    './objects/ObjectAPI',
    './priority/PriorityAPI',
    './status/StatusAPI',
    './telemetry/TelemetryAPI',
    './time/TimeAPI',
    './types/TypeRegistry',
    './user/UserAPI'
], function (
    ActionsAPI,
    CompositionAPI,
    EditorAPI,
    FormsAPI,
    IndicatorAPI,
    MenuAPI,
    NotificationAPI,
    ObjectAPI,
    PriorityAPI,
    StatusAPI,
    TelemetryAPI,
    TimeAPI,
    TypeRegistry,
    UserAPI
) {
    return {
        ActionsAPI: ActionsAPI.default,
        CompositionAPI: CompositionAPI,
        EditorAPI: EditorAPI,
        FormsAPI: FormsAPI,
        IndicatorAPI: IndicatorAPI,
        MenuAPI: MenuAPI.default,
        NotificationAPI: NotificationAPI.default,
        ObjectAPI: ObjectAPI,
        PriorityAPI: PriorityAPI.default,
        StatusAPI: StatusAPI.default,
        TelemetryAPI: TelemetryAPI,
        TimeAPI: TimeAPI.default,
        TypeRegistry: TypeRegistry,
        UserAPI: UserAPI.default
    };
});
