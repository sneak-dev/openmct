/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../../src/controllers/swimlane/TimelineSwimlaneDropHandler'],
    function (TimelineSwimlaneDropHandler) {
        "use strict";

        describe("A timeline's swimlane drop handler", function () {
            var mockSwimlane,
                mockOtherObject,
                mockActionCapability,
                mockPersistence,
                handler;

            beforeEach(function () {
                mockSwimlane = jasmine.createSpyObj(
                    "swimlane",
                    [ "highlight", "highlightBottom" ]
                );
                // domainObject, idPath, children, expanded
                mockSwimlane.domainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability", "useCapability", "hasCapability" ]
                );
                mockSwimlane.idPath = [ 'a', 'b' ];
                mockSwimlane.children = [ {} ];
                mockSwimlane.expanded = true;

                mockSwimlane.parent = {};
                mockSwimlane.parent.idPath = ['a'];
                mockSwimlane.parent.domainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability", "useCapability", "hasCapability" ]
                );
                mockSwimlane.parent.children = [ mockSwimlane ];

                mockSwimlane.children[0].domainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability", "useCapability", "hasCapability" ]
                );


                mockOtherObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability", "useCapability", "hasCapability" ]
                );
                mockActionCapability = jasmine.createSpyObj("action", ["perform", "getActions"]);
                mockPersistence = jasmine.createSpyObj("persistence", ["persist"]);

                mockActionCapability.getActions.andReturn([{}]);
                mockSwimlane.parent.domainObject.getId.andReturn('a');
                mockSwimlane.domainObject.getId.andReturn('b');
                mockSwimlane.children[0].domainObject.getId.andReturn('c');
                mockOtherObject.getId.andReturn('d');

                mockSwimlane.domainObject.getCapability.andCallFake(function (c) {
                    return {
                        action: mockActionCapability,
                        persistence: mockPersistence
                    }[c];
                });
                mockOtherObject.getCapability.andReturn(mockActionCapability);

                mockSwimlane.domainObject.hasCapability.andReturn(true);

                handler = new TimelineSwimlaneDropHandler(mockSwimlane);
            });

            it("disallows drop outside of edit mode", function () {
                // Verify precondition
                expect(handler.allowDropIn('d')).toBeTruthy();
                expect(handler.allowDropAfter('d')).toBeTruthy();
                // Act as if we're not in edit mode
                mockSwimlane.domainObject.hasCapability.andReturn(false);
                // Now, they should be disallowed
                expect(handler.allowDropIn('d')).toBeFalsy();
                expect(handler.allowDropAfter('d')).toBeFalsy();

                // Verify that editor capability was really checked for
                expect(mockSwimlane.domainObject.hasCapability)
                    .toHaveBeenCalledWith('editor');
            });

            it("disallows dropping of parents", function () {
                expect(handler.allowDropIn('a')).toBeFalsy();
                expect(handler.allowDropAfter('a')).toBeFalsy();
            });

            it("does not drop when no highlight state is present", function () {
                // If there's no hover highlight, there's no drop allowed
                handler.drop('d', mockOtherObject);
                expect(mockOtherObject.getCapability)
                    .not.toHaveBeenCalled();
                expect(mockSwimlane.domainObject.useCapability)
                    .not.toHaveBeenCalled();
                expect(mockSwimlane.parent.domainObject.useCapability)
                    .not.toHaveBeenCalled();
            });

            it("inserts into when highlighted", function () {
                var testModel = { composition: [ 'c' ] };
                mockSwimlane.highlight.andReturn(true);
                handler.drop('d');
                // Should have mutated
                expect(mockSwimlane.domainObject.useCapability)
                    .toHaveBeenCalledWith("mutation", jasmine.any(Function));
                // Run the mutator
                mockSwimlane.domainObject.useCapability.mostRecentCall
                    .args[1](testModel);
                expect(testModel.composition).toEqual(['c', 'd']);
                // Finally, should also have persisted
                expect(mockPersistence.persist).toHaveBeenCalled();
            });

            it("removes objects before insertion, if provided", function () {
                var testModel = { composition: [ 'c' ] };
                mockSwimlane.highlight.andReturn(true);
                handler.drop('d', mockOtherObject);
                // Should have invoked a remove action
                expect(mockActionCapability.perform)
                    .toHaveBeenCalledWith('remove');
                // Verify that mutator still ran as expected
                mockSwimlane.domainObject.useCapability.mostRecentCall
                    .args[1](testModel);
                expect(testModel.composition).toEqual(['c', 'd']);
            });

            it("inserts after as a peer when highlighted at the bottom", function () {
                var testModel = { composition: [ 'x', 'b', 'y' ] };
                mockSwimlane.highlightBottom.andReturn(true);
                mockSwimlane.expanded = false;
                handler.drop('d');
                // Should have mutated
                expect(mockSwimlane.parent.domainObject.useCapability)
                    .toHaveBeenCalledWith("mutation", jasmine.any(Function));
                // Run the mutator
                mockSwimlane.parent.domainObject.useCapability.mostRecentCall
                    .args[1](testModel);
                expect(testModel.composition).toEqual([ 'x', 'b', 'd', 'y']);
            });

            it("inserts into when highlighted at the bottom and expanded", function () {
                var testModel = { composition: [ 'c' ] };
                mockSwimlane.highlightBottom.andReturn(true);
                mockSwimlane.expanded = true;
                handler.drop('d');
                // Should have mutated
                expect(mockSwimlane.domainObject.useCapability)
                    .toHaveBeenCalledWith("mutation", jasmine.any(Function));
                // Run the mutator
                mockSwimlane.domainObject.useCapability.mostRecentCall
                    .args[1](testModel);
                expect(testModel.composition).toEqual([ 'd', 'c' ]);
            });

            it("inserts after as a peer when highlighted at the bottom and childless", function () {
                var testModel = { composition: [ 'x', 'b', 'y' ] };
                mockSwimlane.highlightBottom.andReturn(true);
                mockSwimlane.expanded = true;
                mockSwimlane.children = [];
                handler.drop('d');
                // Should have mutated
                expect(mockSwimlane.parent.domainObject.useCapability)
                    .toHaveBeenCalledWith("mutation", jasmine.any(Function));
                // Run the mutator
                mockSwimlane.parent.domainObject.useCapability.mostRecentCall
                    .args[1](testModel);
                expect(testModel.composition).toEqual([ 'x', 'b', 'd', 'y']);
            });

        });
    }
);