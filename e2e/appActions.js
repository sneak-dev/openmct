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

/**
 * The fixtures in this file are to be used to consolidate common actions performed by the
 * various test suites. The goal is only to avoid duplication of code across test suites and not to abstract
 * away the underlying functionality of the application. For more about the App Action pattern, see /e2e/README.md)
 *
 * For example, if two functions are nearly identical in
 * timer.e2e.spec.js and notebook.e2e.spec.js, that function should be generalized and moved into this file.
 */

/**
 * Defines parameters to be used in the creation of a domain object.
 * @typedef {Object} CreateObjectOptions
 * @property {string} type the type of domain object to create (e.g.: "Sine Wave Generator").
 * @property {string} [name] the desired name of the created domain object.
 * @property {string | import('../src/api/objects/ObjectAPI').Identifier} [parent] the Identifier or uuid of the parent object.
 */

/**
 * Contains information about the newly created domain object.
 * @typedef {Object} CreatedObjectInfo
 * @property {string} name the name of the created object
 * @property {string} uuid the uuid of the created object
 * @property {string} url the relative url to the object (for use with `page.goto()`)
 */

const Buffer = require('buffer').Buffer;

/**
 * This common function creates a domain object with the default options. It is the preferred way of creating objects
 * in the e2e suite when uninterested in properties of the objects themselves.
 *
 * @param {import('@playwright/test').Page} page
 * @param {CreateObjectOptions} options
 * @returns {Promise<CreatedObjectInfo>} An object containing information about the newly created domain object.
 */
async function createDomainObjectWithDefaults(page, { type, name, parent = 'mine' }) {
    const parentUrl = await getHashUrlToDomainObject(page, parent);

    // Navigate to the parent object. This is necessary to create the object
    // in the correct location, such as a folder, layout, or plot.
    await page.goto(`${parentUrl}?hideTree=true`);
    await page.waitForLoadState('networkidle');

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click the object specified by 'type'
    await page.click(`li:text("${type}")`);

    // Modify the name input field of the domain object to accept 'name'
    if (name) {
        const nameInput = page.locator('form[name="mctForm"] .first input[type="text"]');
        await nameInput.fill("");
        await nameInput.fill(name);
    }

    // Click OK button and wait for Navigate event
    await Promise.all([
        page.waitForLoadState(),
        page.click('[aria-label="Save"]'),
        // Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);

    // Wait until the URL is updated
    await page.waitForURL(`**/${parent}/*`);
    const uuid = await getFocusedObjectUuid(page);
    const objectUrl = await getHashUrlToDomainObject(page, uuid);

    if (await _isInEditMode(page, uuid)) {
        // Save (exit edit mode)
        await page.locator('button[title="Save"]').click();
        await page.locator('li[title="Save and Finish Editing"]').click();
    }

    return {
        name: name || `Unnamed ${type}`,
        uuid: uuid,
        url: objectUrl
    };
}

/**
 * Create a Plan object from JSON with the provided options.
 * @param {import('@playwright/test').Page} page
 * @param {*} options
 * @returns {Promise<CreatedObjectInfo>} An object containing information about the newly created domain object.
 */
async function createPlanFromJSON(page, { name, json, parent = 'mine' }) {
    const parentUrl = await getHashUrlToDomainObject(page, parent);

    // Navigate to the parent object. This is necessary to create the object
    // in the correct location, such as a folder, layout, or plot.
    await page.goto(`${parentUrl}?hideTree=true`);

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click 'Plan' menu option
    await page.click(`li:text("Plan")`);

    // Modify the name input field of the domain object to accept 'name'
    if (name) {
        const nameInput = page.locator('form[name="mctForm"] .first input[type="text"]');
        await nameInput.fill("");
        await nameInput.fill(name);
    }

    // Upload buffer from memory
    await page.locator('input#fileElem').setInputFiles({
        name: 'plan.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(JSON.stringify(json))
    });

    // Click OK button and wait for Navigate event
    await Promise.all([
        page.waitForLoadState(),
        page.click('[aria-label="Save"]'),
        // Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);

    // Wait until the URL is updated
    await page.waitForURL(`**/mine/*`);
    const uuid = await getFocusedObjectUuid(page);
    const objectUrl = await getHashUrlToDomainObject(page, uuid);

    return {
        uuid,
        name,
        url: objectUrl
    };
}

/**
* Open the given `domainObject`'s context menu from the object tree.
* Expands the path to the object and scrolls to it if necessary.
*
* @param {import('@playwright/test').Page} page
* @param {string} url the url to the object
*/
async function openObjectTreeContextMenu(page, url) {
    await page.goto(url);
    await page.click('button[title="Show selected item in tree"]');
    await page.locator('.is-navigated-object').click({
        button: 'right'
    });
}

/**
 * Gets the UUID of the currently focused object by parsing the current URL
 * and returning the last UUID in the path.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>} the uuid of the focused object
 */
async function getFocusedObjectUuid(page) {
    const UUIDv4Regexp = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
    const focusedObjectUuid = await page.evaluate((regexp) => {
        return window.location.href.split('?')[0].match(regexp).at(-1);
    }, UUIDv4Regexp);

    return focusedObjectUuid;
}

/**
 * Returns the hashUrl to the domainObject given its uuid.
 * Useful for directly navigating to the given domainObject.
 *
 * URLs returned will be of the form `'./browse/#/mine/<uuid0>/<uuid1>/...'`
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} uuid the uuid of the object to get the url for
 * @returns {Promise<string>} the url of the object
 */
async function getHashUrlToDomainObject(page, uuid) {
    const hashUrl = await page.evaluate(async (objectUuid) => {
        const path = await window.openmct.objects.getOriginalPath(objectUuid);
        let url = './#/browse/' + [...path].reverse()
            .map((object) => window.openmct.objects.makeKeyString(object.identifier))
            .join('/');

        // Drop the vestigial '/ROOT' if it exists
        if (url.includes('/ROOT')) {
            url = url.split('/ROOT').join('');
        }

        return url;
    }, uuid);

    return hashUrl;
}

/**
 * Utilizes the OpenMCT API to detect if the given object has an active transaction (is in Edit mode).
 * @private
 * @param {import('@playwright/test').Page} page
 * @param {string | import('../src/api/objects/ObjectAPI').Identifier} identifier
 * @return {Promise<boolean>} true if the object has an active transaction, false otherwise
 */
async function _isInEditMode(page, identifier) {
    // eslint-disable-next-line no-return-await
    return await page.evaluate((objectIdentifier) => window.openmct.objects.isTransactionActive(objectIdentifier), identifier);
}

/**
 * Set the time conductor mode to either fixed timespan or realtime mode.
 * @param {import('@playwright/test').Page} page
 * @param {boolean} [isFixedTimespan=true] true for fixed timespan mode, false for realtime mode; default is true
 */
async function setTimeConductorMode(page, isFixedTimespan = true) {
    // Click 'mode' button
    await page.locator('.c-mode-button').click();

    // Switch time conductor mode
    if (isFixedTimespan) {
        await page.locator('data-testid=conductor-modeOption-fixed').click();
    } else {
        await page.locator('data-testid=conductor-modeOption-realtime').click();
    }
}

/**
 * Set the time conductor to fixed timespan mode
 * @param {import('@playwright/test').Page} page
 */
async function setFixedTimeMode(page) {
    await setTimeConductorMode(page, true);
}

/**
 * Set the time conductor to realtime mode
 * @param {import('@playwright/test').Page} page
 */
async function setRealTimeMode(page) {
    await setTimeConductorMode(page, false);
}

/**
 * @typedef {Object} OffsetValues
 * @property {string | undefined} hours
 * @property {string | undefined} mins
 * @property {string | undefined} secs
 */

/**
 * Set the values (hours, mins, secs) for the TimeConductor offsets when in realtime mode
 * @param {import('@playwright/test').Page} page
 * @param {OffsetValues} offset
 * @param {import('@playwright/test').Locator} offsetButton
 */
async function setTimeConductorOffset(page, {hours, mins, secs}, offsetButton) {
    await offsetButton.click();

    if (hours) {
        await page.fill('.pr-time-controls__hrs', hours);
    }

    if (mins) {
        await page.fill('.pr-time-controls__mins', mins);
    }

    if (secs) {
        await page.fill('.pr-time-controls__secs', secs);
    }

    // Click the check button
    await page.locator('.pr-time__buttons .icon-check').click();
}

/**
 * Set the values (hours, mins, secs) for the start time offset when in realtime mode
 * @param {import('@playwright/test').Page} page
 * @param {OffsetValues} offset
 */
async function setStartOffset(page, offset) {
    const startOffsetButton = page.locator('data-testid=conductor-start-offset-button');
    await setTimeConductorOffset(page, offset, startOffsetButton);
}

/**
 * Set the values (hours, mins, secs) for the end time offset when in realtime mode
 * @param {import('@playwright/test').Page} page
 * @param {OffsetValues} offset
 */
async function setEndOffset(page, offset) {
    const endOffsetButton = page.locator('data-testid=conductor-end-offset-button');
    await setTimeConductorOffset(page, offset, endOffsetButton);
}

// eslint-disable-next-line no-undef
module.exports = {
    createDomainObjectWithDefaults,
    createPlanFromJSON,
    openObjectTreeContextMenu,
    getHashUrlToDomainObject,
    getFocusedObjectUuid,
    setFixedTimeMode,
    setRealTimeMode,
    setStartOffset,
    setEndOffset
};
