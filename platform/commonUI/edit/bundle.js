/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
    "./src/controllers/EditActionController",
    "./src/controllers/EditPanesController",
    "./src/controllers/EditObjectController",
    "./src/actions/EditAndComposeAction",
    "./src/actions/EditAction",
    "./src/actions/SaveAction",
    "./src/actions/SaveAndStopEditingAction",
    "./src/actions/CancelAction",
    "./src/policies/EditPersistableObjectsPolicy",
    "./src/representers/EditRepresenter",
    "./src/capabilities/EditorCapability",
    "./res/templates/library.html",
    "./res/templates/edit-object.html",
    "./res/templates/edit-action-buttons.html",
    "./res/templates/topbar-edit.html"
], function (
    EditActionController,
    EditPanesController,
    EditObjectController,
    EditAndComposeAction,
    EditAction,
    SaveAction,
    SaveAndStopEditingAction,
    CancelAction,
    EditPersistableObjectsPolicy,
    EditRepresenter,
    EditorCapability,
    libraryTemplate,
    editObjectTemplate,
    editActionButtonsTemplate,
    topbarEditTemplate
) {
    return {
        name: "platform/commonUI/edit",
        definition: {
            "extensions": {
                "controllers": [
                    {
                        "key": "EditActionController",
                        "implementation": EditActionController,
                        "depends": [
                            "$scope"
                        ]
                    },
                    {
                        "key": "EditPanesController",
                        "implementation": EditPanesController,
                        "depends": [
                            "$scope"
                        ]
                    },
                    {
                        "key": "EditObjectController",
                        "implementation": EditObjectController,
                        "depends": [
                            "$scope",
                            "$location",
                            "navigationService"
                        ]
                    }
                ],
                "actions": [
                    {
                        "key": "compose",
                        "implementation": EditAndComposeAction
                    },
                    {
                        "key": "edit",
                        "implementation": EditAction,
                        "depends": [
                            "$location",
                            "navigationService",
                            "$log"
                        ],
                        "description": "Edit",
                        "category": "view-control",
                        "cssClass": "major icon-pencil",
                        "group": "action",
                        "priority": 10
                    },
                    {
                        "key": "save-and-stop-editing",
                        "category": "save",
                        "implementation": SaveAndStopEditingAction,
                        "name": "Save and Finish Editing",
                        "cssClass": "icon-save labeled",
                        "description": "Save changes made to these objects.",
                        "depends": [
                            "dialogService",
                            "notificationService"
                        ]
                    },
                    {
                        "key": "save",
                        "category": "save",
                        "implementation": SaveAction,
                        "name": "Save and Continue Editing",
                        "cssClass": "icon-save labeled",
                        "description": "Save changes made to these objects.",
                        "depends": [
                            "dialogService",
                            "notificationService"
                        ]
                    },
                    {
                        "key": "cancel",
                        "category": "conclude-editing",
                        "implementation": CancelAction,
                        // Because we use the name as label for edit buttons and mct-control buttons need
                        // the label to be set to undefined in order to not apply the labeled CSS rule.
                        "name": undefined,
                        "cssClass": "icon-x no-label",
                        "description": "Discard changes made to these objects.",
                        "depends": []
                    }
                ],
                "policies": [
                    {
                        "category": "action",
                        "implementation": EditPersistableObjectsPolicy,
                        "depends": ["openmct"]
                    }
                ],
                "templates": [
                    {
                        "key": "edit-library",
                        "template": libraryTemplate
                    }
                ],
                "representations": [
                    {
                        "key": "edit-object",
                        "template": editObjectTemplate,
                        "uses": [
                            "view"
                        ],
                        "gestures": [
                            "drop"
                        ]
                    },
                    {
                        "key": "edit-action-buttons",
                        "template": editActionButtonsTemplate,
                        "uses": [
                            "action"
                        ]
                    },
                    {
                        "key": "topbar-edit",
                        "template": topbarEditTemplate
                    }
                ],
                "representers": [
                    {
                        "implementation": EditRepresenter,
                        "depends": [
                            "$log"
                        ]
                    }
                ],
                "capabilities": [
                    {
                        "key": "editor",
                        "name": "Editor Capability",
                        "description": "Provides transactional editing capabilities",
                        "implementation": EditorCapability,
                        "depends": [
                            "openmct"
                        ]
                    }
                ],
                "runs": [
                    {
                        depends: [
                            "toolbars[]",
                            "openmct"
                        ],
                        implementation: function (toolbars, openmct) {
                            toolbars.forEach(openmct.toolbars.addProvider, openmct.toolbars);
                        }
                    }
                ]
            }
        }
    };
});
