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

/*
This test suite is dedicated to tests which verify form functionality in isolation
*/

const { test, expect } = require('../../baseFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');
const path = require('path');

const TEST_FOLDER = 'test folder';

test.describe('Form Validation Behavior', () => {
    test('Required Field indicators appear if title is empty and can be corrected', async ({ page }) => {
        //Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        await page.click('button:has-text("Create")');
        await page.click(':nth-match(:text("Folder"), 2)');

        // Fill in empty string into title and trigger validation with 'Tab'
        await page.click('text=Properties Title Notes >> input[type="text"]');
        await page.fill('text=Properties Title Notes >> input[type="text"]', '');
        await page.press('text=Properties Title Notes >> input[type="text"]', 'Tab');

        //Required Field Form Validation
        await expect(page.locator('button:has-text("OK")')).toBeDisabled();
        await expect(page.locator('.c-form-row__state-indicator').first()).toHaveClass(/invalid/);

        //Correct Form Validation for missing title and trigger validation with 'Tab'
        await page.click('text=Properties Title Notes >> input[type="text"]');
        await page.fill('text=Properties Title Notes >> input[type="text"]', TEST_FOLDER);
        await page.press('text=Properties Title Notes >> input[type="text"]', 'Tab');

        //Required Field Form Validation is corrected
        await expect(page.locator('button:has-text("OK")')).toBeEnabled();
        await expect(page.locator('.c-form-row__state-indicator').first()).not.toHaveClass(/invalid/);

        //Finish Creating Domain Object
        await Promise.all([
            page.waitForNavigation(),
            page.click('button:has-text("OK")')
        ]);

        //Verify that the Domain Object has been created with the corrected title property
        await expect(page.locator('.l-browse-bar__object-name')).toContainText(TEST_FOLDER);
    });
});

test.describe('Persistence operations @addInit', () => {
    // add non persistable root item
    test.beforeEach(async ({ page }) => {
        // eslint-disable-next-line no-undef
        await page.addInitScript({ path: path.join(__dirname, '../../helper', 'addNoneditableObject.js') });
    });

    test('Persistability should be respected in the create form location field', async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/4323'
        });
        await page.goto('./', { waitUntil: 'networkidle' });

        await page.click('button:has-text("Create")');

        await page.click('text=Condition Set');

        await page.locator('form[name="mctForm"] >> text=Persistence Testing').click();

        const okButton = page.locator('button:has-text("OK")');
        await expect(okButton).toBeDisabled();
    });
});

test.describe('Persistence operations @couchdb', () => {
    test.use({ failOnConsoleError: false });
    test('Editing object properties should generate a single persistence operation', async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5616'
        });

        await page.goto('./', { waitUntil: 'networkidle' });

        // Create a new 'Clock' object with default settings
        const clock = await createDomainObjectWithDefaults(page, {
            type: 'Clock'
        });

        // Count all persistence operations (PUT requests) for this specific object
        let putRequestCount = 0;
        page.on('request', req => {
            if (req.method() === 'PUT' && req.url().endsWith(clock.uuid)) {
                putRequestCount += 1;
            }
        });

        // Open the edit form for the clock object
        await page.click('button[title="More options"]');
        await page.click('li[title="Edit properties of this object."]');

        // Modify the display format from default 12hr -> 24hr and click 'Save'
        await page.locator('select[aria-label="12 or 24 hour clock"]').selectOption({ value: 'clock24' });
        await page.click('button[aria-label="Save"]');

        await expect.poll(() => putRequestCount, {
            message: 'Verify a single PUT request was made to persist the object',
            timeout: 1000
        }).toEqual(1);
    });
});

test.describe('Form Correctness by Object Type', () => {
    test.fixme('Verify correct behavior of number object (SWG)', async ({page}) => {});
    test.fixme('Verify correct behavior of number object Timer', async ({page}) => {});
    test.fixme('Verify correct behavior of number object Plan View', async ({page}) => {});
    test.fixme('Verify correct behavior of number object Clock', async ({page}) => {});
    test.fixme('Verify correct behavior of number object Hyperlink', async ({page}) => {});
});
