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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine */

define(
    ['../src/NotificationService'],
    function (NotificationService) {
        "use strict";

        describe("The notification service ", function () {
            var notificationService,
                mockTimeout,
                mockAutoDismiss,
                mockMinimizeTimeout,
                successModel,
                errorModel;

            beforeEach(function(){
                mockTimeout = jasmine.createSpy("$timeout");
                mockAutoDismiss = mockMinimizeTimeout = 1000;
                notificationService = new NotificationService(
                    mockTimeout, mockAutoDismiss, mockMinimizeTimeout);
                successModel = {
                    title: "Mock Success Notification",
                    severity: "info"
                };
                errorModel = {
                    title: "Mock Error Notification",
                    severity: "error"
                };
            });

            it("gets a new success notification, making" +
                " the notification active", function() {
                var activeNotification;
                notificationService.notify(successModel);
                activeNotification = notificationService.getActiveNotification();
                expect(activeNotification).toBe(successModel);
            });

            it("gets a new success notification with" +
                " numerical auto-dismiss specified. ", function() {
                var activeNotification;
                successModel.autoDismiss = 1000;
                notificationService.notify(successModel);
                activeNotification = notificationService.getActiveNotification();
                expect(activeNotification).toBe(successModel);
                mockTimeout.mostRecentCall.args[0]();
                expect(mockTimeout.calls.length).toBe(2);
                mockTimeout.mostRecentCall.args[0]();
                activeNotification = notificationService.getActiveNotification();
                expect(activeNotification).toBeUndefined();
            });

            it("gets a new notification with" +
                " boolean auto-dismiss specified. ", function() {
                var activeNotification;
                successModel.autoDismiss = true;
                notificationService.notify(successModel);
                activeNotification = notificationService.getActiveNotification();
                expect(activeNotification).toBe(successModel);
                mockTimeout.mostRecentCall.args[0]();
                expect(mockTimeout.calls.length).toBe(2);
                mockTimeout.mostRecentCall.args[0]();
                activeNotification = notificationService.getActiveNotification();
                expect(activeNotification).toBeUndefined();
            });

            describe(" gets called with multiple notifications", function(){
                it("auto-dismisses the previously active notification, making" +
                    " the new notification active", function() {
                    var activeNotification;
                    //First pre-load with a info message
                    notificationService.notify(successModel);
                    activeNotification =
                        notificationService.getActiveNotification();
                    //Initially expect the active notification to be info
                    expect(activeNotification).toBe(successModel);
                    //Then notify of an error
                    notificationService.notify(errorModel);
                    //But it should be auto-dismissed and replaced with the
                    // error notification
                    mockTimeout.mostRecentCall.args[0]();
                    //Two timeouts, one is to force minimization after
                    // displaying the message for a minimum period, the
                    // second is to allow minimization animation to take place.
                    mockTimeout.mostRecentCall.args[0]();
                    activeNotification = notificationService.getActiveNotification();
                    expect(activeNotification).toBe(errorModel);
                });
                it("auto-minimizes an active error notification", function() {
                    var activeNotification;
                    //First pre-load with an error message
                    notificationService.notify(errorModel);
                    //Then notify of info
                    notificationService.notify(successModel);
                    expect(notificationService.notifications.length).toEqual(2);
                    //Mock the auto-minimize
                    mockTimeout.mostRecentCall.args[0]();
                    //Two timeouts, one is to force minimization after
                    // displaying the message for a minimum period, the
                    // second is to allow minimization animation to take place.
                    mockTimeout.mostRecentCall.args[0]();
                    //Previous error message should be minimized, not
                    // dismissed
                    expect(notificationService.notifications.length).toEqual(2);
                    activeNotification =
                        notificationService.getActiveNotification();
                    expect(activeNotification).toBe(successModel);
                    expect(errorModel.minimized).toEqual(true);
                });
                it("auto-minimizes errors when a number of them arrive in" +
                    " short succession ", function() {
                    var activeNotification,
                        error2 = {
                            title: "Second Mock Error Notification",
                            severity: "error"
                        },
                        error3 = {
                            title: "Third Mock Error Notification",
                            severity: "error"
                        };

                    //First pre-load with a info message
                    notificationService.notify(errorModel);
                    //Then notify of a third error
                    notificationService.notify(error2);
                    notificationService.notify(error3);
                    expect(notificationService.notifications.length).toEqual(3);
                    //Mock the auto-minimize
                    mockTimeout.mostRecentCall.args[0]();
                    //Two timeouts, one is to force minimization after
                    // displaying the message for a minimum period, the
                    // second is to allow minimization animation to take place.
                    mockTimeout.mostRecentCall.args[0]();
                    //Previous error message should be minimized, not
                    // dismissed
                    expect(notificationService.notifications.length).toEqual(3);
                    activeNotification =
                        notificationService.getActiveNotification();
                    expect(activeNotification).toBe(error2);
                    expect(errorModel.minimized).toEqual(true);

                    //Mock the second auto-minimize
                    mockTimeout.mostRecentCall.args[0]();
                    //Two timeouts, one is to force minimization after
                    // displaying the message for a minimum period, the
                    // second is to allow minimization animation to take place.
                    mockTimeout.mostRecentCall.args[0]();
                    activeNotification =
                        notificationService.getActiveNotification();
                    expect(activeNotification).toBe(error3);
                    expect(error2.minimized).toEqual(true);

                });
            });
        });
    });