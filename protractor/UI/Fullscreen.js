/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
//TODO Add filter for duplications/
var fullScreenFile = require("../common/Buttons");

describe('Enable Fullscreen', function() {
    var fullScreenClass = new fullScreenFile();

    beforeEach(require('../common/Launch'));

    beforeEach(function() {
            browser.wait(function(){
                return element(by.css('[title="Enter full screen mode"]')).isPresent();
            }, 7000);
            browser.sleep(1000);
    });

    it('should find fullscreen button', function(){
        expect(element(by.css('[title="Enter full screen mode"]')).isDisplayed()).toBeTruthy();

    });it('should enter fullscreen when fullscreen button is pressed', function(){
        function getFullScreen(){
            return document.webkitIsFullScreen;
        }
        var fullscreen = browser.executeScript(getFullScreen)
        expect(fullscreen).toBeFalsy();
        fullScreenClass.fullScreen()
        fullscreen = browser.executeScript(getFullScreen)
        expect(fullscreen).toBeTruthy();
    });
});
