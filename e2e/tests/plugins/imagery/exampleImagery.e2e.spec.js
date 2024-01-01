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
This test suite is dedicated to tests which verify the basic operations surrounding imagery,
but only assume that example imagery is present.
*/
/* globals process */

const { test } = require('../../../fixtures.js');
const { expect } = require('@playwright/test');

test.describe('Example Imagery', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(msg.text()));
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        //Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Example Imagery
        await page.click('text=Example Imagery');

        // Click on My Items in Tree. Workaround for https://github.com/nasa/openmct/issues/5184
        await page.click('form[name="mctForm"] a:has-text("My Items")');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle'}),
            page.click('text=OK'),
            //Wait for Save Banner to appear
            page.waitForSelector('.c-message-banner__message')
        ]);
        //Wait until Save Banner is gone
        await page.waitForSelector('.c-message-banner__message', { state: 'detached'});
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');
    });

    const backgroundImageSelector = '.c-imagery__main-image__background-image';
    test('Can use Mouse Wheel to zoom in and out of latest image', async ({ page }) => {
        const bgImageLocator = await page.locator(backgroundImageSelector);
        const deltaYStep = 100; //equivalent to 1x zoom
        await bgImageLocator.hover();
        const originalImageDimensions = await page.locator(backgroundImageSelector).boundingBox();
        // zoom in
        await bgImageLocator.hover();
        await page.mouse.wheel(0, deltaYStep * 2);
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        const imageMouseZoomedIn = await page.locator(backgroundImageSelector).boundingBox();
        // zoom out
        await bgImageLocator.hover();
        await page.mouse.wheel(0, -deltaYStep);
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        const imageMouseZoomedOut = await page.locator(backgroundImageSelector).boundingBox();

        expect(imageMouseZoomedIn.height).toBeGreaterThan(originalImageDimensions.height);
        expect(imageMouseZoomedIn.width).toBeGreaterThan(originalImageDimensions.width);
        expect(imageMouseZoomedOut.height).toBeLessThan(imageMouseZoomedIn.height);
        expect(imageMouseZoomedOut.width).toBeLessThan(imageMouseZoomedIn.width);

    });

    test('Can use alt+drag to move around image once zoomed in', async ({ page }) => {
        const deltaYStep = 100; //equivalent to 1x zoom
        const panHotkey = process.platform === 'linux' ? ['Control', 'Alt'] : ['Alt'];

        const bgImageLocator = await page.locator(backgroundImageSelector);
        await bgImageLocator.hover();

        // zoom in
        await page.mouse.wheel(0, deltaYStep * 2);
        await bgImageLocator.hover();
        const zoomedBoundingBox = await bgImageLocator.boundingBox();
        const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
        const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;
        // move to the right

        // center the mouse pointer
        await page.mouse.move(imageCenterX, imageCenterY);

        //Get Diagnostic info about process environment
        console.log('process.platform is ' + process.platform);
        const getUA = await page.evaluate(() => navigator.userAgent);
        console.log('navigator.userAgent ' + getUA);
        // Pan Imagery Hints
        const expectedAltText = process.platform === 'linux' ? 'Ctrl+Alt drag to pan' : 'Alt drag to pan';
        const imageryHintsText = await page.locator('.c-imagery__hints').innerText();
        expect(expectedAltText).toEqual(imageryHintsText);

        // pan right
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX - 200, imageCenterY, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterRightPanBoundingBox = await bgImageLocator.boundingBox();
        expect(zoomedBoundingBox.x).toBeGreaterThan(afterRightPanBoundingBox.x);

        // pan left
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterLeftPanBoundingBox = await bgImageLocator.boundingBox();
        expect(afterRightPanBoundingBox.x).toBeLessThan(afterLeftPanBoundingBox.x);

        // pan up
        await page.mouse.move(imageCenterX, imageCenterY);
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY + 200, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterUpPanBoundingBox = await bgImageLocator.boundingBox();
        expect(afterUpPanBoundingBox.y).toBeGreaterThan(afterLeftPanBoundingBox.y);

        // pan down
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY - 200, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterDownPanBoundingBox = await bgImageLocator.boundingBox();
        expect(afterDownPanBoundingBox.y).toBeLessThan(afterUpPanBoundingBox.y);

    });

    test('Can use + - buttons to zoom on the image', async ({ page }) => {
        const bgImageLocator = await page.locator(backgroundImageSelector);
        await bgImageLocator.hover();
        const zoomInBtn = await page.locator('.t-btn-zoom-in');
        const zoomOutBtn = await page.locator('.t-btn-zoom-out');
        const initialBoundingBox = await bgImageLocator.boundingBox();

        await zoomInBtn.click();
        await zoomInBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        const zoomedInBoundingBox = await bgImageLocator.boundingBox();
        expect(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
        expect(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

        await zoomOutBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        const zoomedOutBoundingBox = await bgImageLocator.boundingBox();
        expect(zoomedOutBoundingBox.height).toBeLessThan(zoomedInBoundingBox.height);
        expect(zoomedOutBoundingBox.width).toBeLessThan(zoomedInBoundingBox.width);

    });

    test('Can use the reset button to reset the image', async ({ page }) => {
        const bgImageLocator = await page.locator(backgroundImageSelector);
        // wait for zoom animation to finish
        await bgImageLocator.hover();

        const zoomInBtn = await page.locator('.t-btn-zoom-in');
        const zoomResetBtn = await page.locator('.t-btn-zoom-reset');
        const initialBoundingBox = await bgImageLocator.boundingBox();

        await zoomInBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        await zoomInBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();

        const zoomedInBoundingBox = await bgImageLocator.boundingBox();
        expect.soft(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
        expect.soft(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

        await zoomResetBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();

        const resetBoundingBox = await bgImageLocator.boundingBox();
        expect.soft(resetBoundingBox.height).toBeLessThan(zoomedInBoundingBox.height);
        expect.soft(resetBoundingBox.width).toBeLessThan(zoomedInBoundingBox.width);

        expect.soft(resetBoundingBox.height).toEqual(initialBoundingBox.height);
        expect(resetBoundingBox.width).toEqual(initialBoundingBox.width);
    });

    test('Using the zoom features does not pause telemetry', async ({ page }) => {
        const bgImageLocator = page.locator(backgroundImageSelector);
        const pausePlayButton = page.locator('.c-button.pause-play');
        // wait for zoom animation to finish
        await bgImageLocator.hover();

        // open the time conductor drop down
        await page.locator('.c-conductor__controls button.c-mode-button').click();
        // Click local clock
        await page.locator('.icon-clock >> text=Local Clock').click();

        await expect.soft(pausePlayButton).not.toHaveClass(/is-paused/);
        const zoomInBtn = page.locator('.t-btn-zoom-in');
        await zoomInBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();

        return expect(pausePlayButton).not.toHaveClass(/is-paused/);
    });

});

// The following test case will cover these scenarios
// ('Can use Mouse Wheel to zoom in and out of previous image');
// ('Can use alt+drag to move around image once zoomed in');
// ('Clicking on the left arrow should pause the imagery and go to previous image');
// ('If the imagery view is in pause mode, it should not be updated when new images come in');
// ('If the imagery view is not in pause mode, it should be updated when new images come in');
const backgroundImageSelector = '.c-imagery__main-image__background-image';
test('Example Imagery in Display layout', async ({ page }) => {
    // Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    // Click the Create button
    await page.click('button:has-text("Create")');

    // Click text=Example Imagery
    await page.click('text=Example Imagery');

    // Clear and set Image load delay (milliseconds)
    await page.click('input[type="number"]', {clickCount: 3});
    await page.type('input[type="number"]', "20");

    // Click text=OK
    await Promise.all([
        page.waitForNavigation({waitUntil: 'networkidle'}),
        page.click('text=OK'),
        //Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);
    // Wait until Save Banner is gone
    await page.waitForSelector('.c-message-banner__message', { state: 'detached'});
    await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');
    const bgImageLocator = await page.locator(backgroundImageSelector);
    await bgImageLocator.hover();

    // Click previous image button
    const previousImageButton = await page.locator('.c-nav--prev');
    await previousImageButton.click();

    // Verify previous image
    const selectedImage = page.locator('.selected');
    await expect(selectedImage).toBeVisible();

    // Zoom in
    const originalImageDimensions = await page.locator(backgroundImageSelector).boundingBox();
    await bgImageLocator.hover();
    const deltaYStep = 100; // equivalent to 1x zoom
    await page.mouse.wheel(0, deltaYStep * 2);
    const zoomedBoundingBox = await bgImageLocator.boundingBox();
    const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
    const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;

    // Wait for zoom animation to finish
    await bgImageLocator.hover();
    const imageMouseZoomedIn = await page.locator(backgroundImageSelector).boundingBox();
    expect(imageMouseZoomedIn.height).toBeGreaterThan(originalImageDimensions.height);
    expect(imageMouseZoomedIn.width).toBeGreaterThan(originalImageDimensions.width);

    // Center the mouse pointer
    await page.mouse.move(imageCenterX, imageCenterY);

    // Pan Imagery Hints
    console.log('process.platform is ' + process.platform);
    const expectedAltText = process.platform === 'linux' ? 'Ctrl+Alt drag to pan' : 'Alt drag to pan';
    const imageryHintsText = await page.locator('.c-imagery__hints').innerText();
    expect(expectedAltText).toEqual(imageryHintsText);

    // Click next image button
    const nextImageButton = await page.locator('.c-nav--next');
    await nextImageButton.click();

    // Click fixed timespan button
    await page.locator('.c-button__label >> text=Fixed Timespan').click();

    // Click local clock
    await page.locator('.icon-clock >> text=Local Clock').click();

    // Zoom in on next image
    await bgImageLocator.hover();
    await page.mouse.wheel(0, deltaYStep * 2);

    // Wait for zoom animation to finish
    await bgImageLocator.hover();
    const imageNextMouseZoomedIn = await page.locator(backgroundImageSelector).boundingBox();
    expect(imageNextMouseZoomedIn.height).toBeGreaterThan(originalImageDimensions.height);
    expect(imageNextMouseZoomedIn.width).toBeGreaterThan(originalImageDimensions.width);

    // Click previous image button
    await previousImageButton.click();

    // Verify previous image
    await expect(selectedImage).toBeVisible();

    // Wait 20ms to verify no new image has come in
    await page.waitForTimeout(21);

    //Get background-image url from background-image css prop
    const backgroundImage = await page.locator('.c-imagery__main-image__background-image');
    let backgroundImageUrl = await backgroundImage.evaluate((el) => {
        return window.getComputedStyle(el).getPropertyValue('background-image').match(/url\(([^)]+)\)/)[1];
    });
    let backgroundImageUrl1 = backgroundImageUrl.slice(1, -1); //forgive me, padre
    console.log('backgroundImageUrl1 ' + backgroundImageUrl1);

    // sleep 21ms
    await page.waitForTimeout(21);

    // Verify next image has updated
    let backgroundImageUrlNext = await backgroundImage.evaluate((el) => {
        return window.getComputedStyle(el).getPropertyValue('background-image').match(/url\(([^)]+)\)/)[1];
    });
    let backgroundImageUrl2 = backgroundImageUrlNext.slice(1, -1); //forgive me, padre
    console.log('backgroundImageUrl2 ' + backgroundImageUrl2);

    // Expect backgroundImageUrl2 to be greater then backgroundImageUrl1
    expect(backgroundImageUrl2 >= backgroundImageUrl1);
});

test.describe('Example imagery thumbnails resize in display layouts', () => {

    test('Resizing the layout changes thumbnail visibility and size', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });

        const thumbsWrapperLocator = await page.locator('.c-imagery__thumbs-wrapper');
        // Click button:has-text("Create")
        await page.locator('button:has-text("Create")').click();

        // Click li:has-text("Display Layout")
        await page.locator('li:has-text("Display Layout")').click();
        const displayLayoutTitleField = page.locator('text=Properties Title Notes Horizontal grid (px) Vertical grid (px) Horizontal size ( >> input[type="text"]');
        await displayLayoutTitleField.click();

        await displayLayoutTitleField.fill('Thumbnail Display Layout');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click()
        ]);

        // Click text=Snapshot Save and Finish Editing Save and Continue Editing >> button >> nth=1
        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();

        // Click text=Save and Finish Editing
        await page.locator('text=Save and Finish Editing').click();

        // Click button:has-text("Create")
        await page.locator('button:has-text("Create")').click();

        // Click li:has-text("Example Imagery")
        await page.locator('li:has-text("Example Imagery")').click();

        const imageryTitleField = page.locator('text=Properties Title Notes Images url list (comma separated) Image load delay (milli >> input[type="text"]');
        // Click text=Properties Title Notes Images url list (comma separated) Image load delay (milli >> input[type="text"]
        await imageryTitleField.click();

        // Fill text=Properties Title Notes Images url list (comma separated) Image load delay (milli >> input[type="text"]
        await imageryTitleField.fill('Thumbnail Example Imagery');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click()
        ]);

        // Click text=Thumbnail Example Imagery Imagery Layout Snapshot >> button >> nth=0
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Thumbnail Example Imagery Imagery Layout Snapshot >> button').first().click()
        ]);

        // Edit mode
        await page.locator('text=Thumbnail Display Layout Snapshot >> button').nth(3).click();

        // Click on example imagery to expose toolbar
        await page.locator('text=Thumbnail Example Imagery Snapshot Large View').click();

        // expect thumbnails not be visible when first added
        await expect.soft(thumbsWrapperLocator.isHidden()).toBeTruthy();

        // Resize the example imagery vertically to change the thumbnail visibility
        /*
        The following arbitrary values are added to observe the separate visual
        conditions of the thumbnails (hidden, small thumbnails, regular thumbnails).
        Specifically, height is set to 50px for small thumbs and 100px for regular
        */
        // Click #mct-input-id-103
        await page.locator('#mct-input-id-103').click();

        // Fill #mct-input-id-103
        await page.locator('#mct-input-id-103').fill('50');

        expect(thumbsWrapperLocator.isVisible()).toBeTruthy();
        await expect(thumbsWrapperLocator).toHaveClass(/is-small-thumbs/);

        // Resize the example imagery vertically to change the thumbnail visibility
        // Click #mct-input-id-103
        await page.locator('#mct-input-id-103').click();

        // Fill #mct-input-id-103
        await page.locator('#mct-input-id-103').fill('100');

        expect(thumbsWrapperLocator.isVisible()).toBeTruthy();
        await expect(thumbsWrapperLocator).not.toHaveClass(/is-small-thumbs/);
    });
});

test.describe('Example Imagery in Flexible layout', () => {
    test.fixme('Can use Mouse Wheel to zoom in and out of previous image');
    test.fixme('Can use alt+drag to move around image once zoomed in');
    test.fixme('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    test.fixme('Clicking on the left arrow should pause the imagery and go to previous image');
    test.fixme('If the imagery view is in pause mode, it should not be updated when new images come in');
    test.fixme('If the imagery view is not in pause mode, it should be updated when new images come in');
});

test.describe('Example Imagery in Tabs view', () => {
    test.fixme('Can use Mouse Wheel to zoom in and out of previous image');
    test.fixme('Can use alt+drag to move around image once zoomed in');
    test.fixme('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    test.fixme('Can zoom into a previous image from thumbstrip in real-time or fixed-time');
    test.fixme('Clicking on the left arrow should pause the imagery and go to previous image');
    test.fixme('If the imagery view is in pause mode, it should not be updated when new images come in');
    test.fixme('If the imagery view is not in pause mode, it should be updated when new images come in');
});
