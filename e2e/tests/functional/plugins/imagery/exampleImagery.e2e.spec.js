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
const { v4: uuid } = require('uuid');
const { waitForAnimations } = require('../../../../baseFixtures');
const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');
const backgroundImageSelector = '.c-imagery__main-image__background-image';
const panHotkey = process.platform === 'linux' ? ['Control', 'Alt'] : ['Alt'];
const expectedAltText = process.platform === 'linux' ? 'Ctrl+Alt drag to pan' : 'Alt drag to pan';

//The following block of tests verifies the basic functionality of example imagery and serves as a template for Imagery objects embedded in other objects.
test.describe('Example Imagery Object', () => {
    test.beforeEach(async ({ page }) => {
        //Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Create a default 'Example Imagery' object
        await createDomainObjectWithDefaults(page, { type: 'Example Imagery' });

        // Verify that the created object is focused
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');
        await page.locator(backgroundImageSelector).hover({trial: true});
    });

    test('Can use Mouse Wheel to zoom in and out of latest image', async ({ page }) => {
        // Zoom in x2 and assert
        await mouseZoomOnImageAndAssert(page, 2);

        // Zoom out x2 and assert
        await mouseZoomOnImageAndAssert(page, -2);
    });

    test('Can adjust image brightness/contrast by dragging the sliders', async ({ page, browserName }) => {
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip(browserName === 'firefox', 'This test needs to be updated to work with firefox');
        // Open the image filter menu
        await page.locator('[role=toolbar] button[title="Brightness and contrast"]').click();

        // Drag the brightness and contrast sliders around and assert filter values
        await dragBrightnessSliderAndAssertFilterValues(page);
        await dragContrastSliderAndAssertFilterValues(page);
    });

    test('Can use alt+drag to move around image once zoomed in', async ({ page }) => {
        const deltaYStep = 100; //equivalent to 1x zoom

        await page.locator(backgroundImageSelector).hover({trial: true});

        // zoom in
        await page.mouse.wheel(0, deltaYStep * 2);
        await page.locator(backgroundImageSelector).hover({trial: true});
        const zoomedBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
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
        const imageryHintsText = await page.locator('.c-imagery__hints').innerText();
        expect(expectedAltText).toEqual(imageryHintsText);

        // pan right
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX - 200, imageCenterY, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterRightPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(zoomedBoundingBox.x).toBeGreaterThan(afterRightPanBoundingBox.x);

        // pan left
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterLeftPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(afterRightPanBoundingBox.x).toBeLessThan(afterLeftPanBoundingBox.x);

        // pan up
        await page.mouse.move(imageCenterX, imageCenterY);
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY + 200, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterUpPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(afterUpPanBoundingBox.y).toBeGreaterThan(afterLeftPanBoundingBox.y);

        // pan down
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY - 200, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterDownPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(afterDownPanBoundingBox.y).toBeLessThan(afterUpPanBoundingBox.y);

    });

    test('Can use + - buttons to zoom on the image @unstable', async ({ page }) => {
        await buttonZoomOnImageAndAssert(page);
    });

    test('Can use the reset button to reset the image @unstable', async ({ page }, testInfo) => {
        test.slow(testInfo.project === 'chrome-beta', "This test is slow in chrome-beta");
        // Get initial image dimensions
        const initialBoundingBox = await page.locator(backgroundImageSelector).boundingBox();

        // Zoom in twice via button
        await zoomIntoImageryByButton(page);
        await zoomIntoImageryByButton(page);

        // Get and assert zoomed in image dimensions
        const zoomedInBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect.soft(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
        expect.soft(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

        // Reset pan and zoom and assert against initial image dimensions
        await resetImageryPanAndZoom(page);
        const finalBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(finalBoundingBox).toEqual(initialBoundingBox);
    });

    test('Using the zoom features does not pause telemetry', async ({ page }) => {
        const pausePlayButton = page.locator('.c-button.pause-play');

        // open the time conductor drop down
        await page.locator('.c-mode-button').click();

        // Click local clock
        await page.locator('[data-testid="conductor-modeOption-realtime"]').click();
        await expect.soft(pausePlayButton).not.toHaveClass(/is-paused/);

        // Zoom in via button
        await zoomIntoImageryByButton(page);
        await expect(pausePlayButton).not.toHaveClass(/is-paused/);
    });
});

test.describe('Example Imagery in Display Layout', () => {
    let displayLayout;
    test.beforeEach(async ({ page }) => {
        // Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        displayLayout = await createDomainObjectWithDefaults(page, { type: 'Display Layout' });
        await page.goto(displayLayout.url);

        /* Create Sine Wave Generator with minimum Image Load Delay */
        // Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Example Imagery
        await page.click('text=Example Imagery');

        // Clear and set Image load delay to minimum value
        await page.locator('input[type="number"]').fill('');
        await page.locator('input[type="number"]').fill('5000');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle'}),
            page.click('text=OK'),
            //Wait for Save Banner to appear
            page.waitForSelector('.c-message-banner__message')
        ]);

        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');

        await page.goto(displayLayout.url);
    });

    test('Imagery View operations @unstable', async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5265'
        });

        // Edit mode
        await page.click('button[title="Edit"]');

        // Click on example imagery to expose toolbar
        await page.locator('.c-so-view__header').click();

        // Adjust object height
        await page.locator('div[title="Resize object height"] > input').click();
        await page.locator('div[title="Resize object height"] > input').fill('50');

        // Adjust object width
        await page.locator('div[title="Resize object width"] > input').click();
        await page.locator('div[title="Resize object width"] > input').fill('50');

        await performImageryViewOperationsAndAssert(page);
    });

    test('Resizing the layout changes thumbnail visibility and size', async ({ page }) => {
        const thumbsWrapperLocator = page.locator('.c-imagery__thumbs-wrapper');
        // Edit mode
        await page.click('button[title="Edit"]');

        // Click on example imagery to expose toolbar
        await page.locator('.c-so-view__header').click();

        // expect thumbnails not be visible when first added
        expect.soft(thumbsWrapperLocator.isHidden()).toBeTruthy();

        // Resize the example imagery vertically to change the thumbnail visibility
        /*
        The following arbitrary values are added to observe the separate visual
        conditions of the thumbnails (hidden, small thumbnails, regular thumbnails).
        Specifically, height is set to 50px for small thumbs and 100px for regular
        */
        await page.locator('div[title="Resize object height"] > input').click();
        await page.locator('div[title="Resize object height"] > input').fill('50');

        expect(thumbsWrapperLocator.isVisible()).toBeTruthy();
        await expect(thumbsWrapperLocator).toHaveClass(/is-small-thumbs/);

        // Resize the example imagery vertically to change the thumbnail visibility
        await page.locator('div[title="Resize object height"] > input').click();
        await page.locator('div[title="Resize object height"] > input').fill('100');

        expect(thumbsWrapperLocator.isVisible()).toBeTruthy();
        await expect(thumbsWrapperLocator).not.toHaveClass(/is-small-thumbs/);
    });
});

test.describe('Example Imagery in Flexible layout', () => {
    let flexibleLayout;
    test.beforeEach(async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });

        flexibleLayout = await createDomainObjectWithDefaults(page, { type: 'Flexible Layout' });
        await page.goto(flexibleLayout.url);

        /* Create Sine Wave Generator with minimum Image Load Delay */
        // Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Example Imagery
        await page.click('text=Example Imagery');

        // Clear and set Image load delay to minimum value
        await page.locator('input[type="number"]').fill('');
        await page.locator('input[type="number"]').fill('5000');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle'}),
            page.click('text=OK'),
            //Wait for Save Banner to appear
            page.waitForSelector('.c-message-banner__message')
        ]);

        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');

        await page.goto(flexibleLayout.url);
    });
    test('Imagery View operations @unstable', async ({ page, browserName }) => {
        test.fixme(browserName === 'firefox', 'This test needs to be updated to work with firefox');
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5326'
        });

        await performImageryViewOperationsAndAssert(page);
    });
});

test.describe('Example Imagery in Tabs View', () => {
    let tabsView;
    test.beforeEach(async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });

        tabsView = await createDomainObjectWithDefaults(page, { type: 'Tabs View' });
        await page.goto(tabsView.url);

        /* Create Sine Wave Generator with minimum Image Load Delay */
        // Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Example Imagery
        await page.click('text=Example Imagery');

        // Clear and set Image load delay to minimum value
        await page.locator('input[type="number"]').fill('');
        await page.locator('input[type="number"]').fill('5000');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle'}),
            page.click('text=OK'),
            //Wait for Save Banner to appear
            page.waitForSelector('.c-message-banner__message')
        ]);

        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');

        await page.goto(tabsView.url);
    });
    test('Imagery View operations @unstable', async ({ page }) => {
        await performImageryViewOperationsAndAssert(page);
    });
});

test.describe('Example Imagery in Time Strip', () => {
    let timeStripObject;
    test.beforeEach(async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
        timeStripObject = await createDomainObjectWithDefaults(page, {
            type: 'Time Strip',
            name: 'Time Strip'.concat(' ', uuid())
        });

        await createDomainObjectWithDefaults(page, {
            type: 'Example Imagery',
            name: 'Example Imagery'.concat(' ', uuid()),
            parent: timeStripObject.uuid
        });
        // Navigate to timestrip
        await page.goto(timeStripObject.url);
    });
    test('Clicking a thumbnail loads the image in large view', async ({ page, browserName }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5632'
        });
        await page.locator('.c-imagery-tsv-container').hover();
        // get url of the hovered image
        const hoveredImg = page.locator('.c-imagery-tsv div.c-imagery-tsv__image-wrapper:hover img');
        const hoveredImgSrc = await hoveredImg.getAttribute('src');
        expect(hoveredImgSrc).toBeTruthy();
        await page.locator('.c-imagery-tsv-container').click();
        // get image of view large container
        const viewLargeImg = page.locator('img.c-imagery__main-image__image');
        const viewLargeImgSrc = await viewLargeImg.getAttribute('src');
        expect(viewLargeImgSrc).toBeTruthy();
        expect(viewLargeImgSrc).toEqual(hoveredImgSrc);
    });
});

/**
 * Perform the common actions and assertions for the Imagery View.
 * This function verifies the following in order:
 * 1. Can zoom in/out using the zoom buttons
 * 2. Can zoom in/out using the mouse wheel
 * 3. Can pan the image using the pan hotkey + mouse drag
 * 4. Clicking on the left arrow button pauses imagery and moves to the previous image
 * 5. Imagery is updated as new images stream in, regardless of pause status
 * 6. Old images are discarded when new images stream in
 * 7. Image brightness/contrast can be adjusted by dragging the sliders
 * @param {import('@playwright/test').Page} page
 */
async function performImageryViewOperationsAndAssert(page) {
    // Click previous image button
    const previousImageButton = page.locator('.c-nav--prev');
    await previousImageButton.click();

    // Verify previous image
    const selectedImage = page.locator('.selected');
    await expect(selectedImage).toBeVisible();

    // Use the zoom buttons to zoom in and out
    await buttonZoomOnImageAndAssert(page);

    // Use Mouse Wheel to zoom in to previous image
    await mouseZoomOnImageAndAssert(page, 2);

    // Use alt+drag to move around image once zoomed in
    await panZoomAndAssertImageProperties(page);

    // Use Mouse Wheel to zoom out of previous image
    await mouseZoomOnImageAndAssert(page, -2);

    // Click next image button
    const nextImageButton = page.locator('.c-nav--next');
    await nextImageButton.click();

    // Click time conductor mode button
    await page.locator('.c-mode-button').click();

    // Select local clock mode
    await page.locator('[data-testid=conductor-modeOption-realtime]').click();

    // Zoom in on next image
    await mouseZoomOnImageAndAssert(page, 2);

    // Clicking on the left arrow should pause the imagery and go to previous image
    await previousImageButton.click();
    await expect(page.locator('.c-button.pause-play')).toHaveClass(/is-paused/);
    await expect(selectedImage).toBeVisible();

    // The imagery view should be updated when new images come in
    const imageCount = await page.locator('.c-imagery__thumb').count();
    await expect.poll(async () => {
        const newImageCount = await page.locator('.c-imagery__thumb').count();

        return newImageCount;
    }, {
        message: "verify that old images are discarded",
        timeout: 7 * 1000
    }).toBe(imageCount);

    // Verify selected image is still displayed
    await expect(selectedImage).toBeVisible();

    // Unpause imagery
    await page.locator('.pause-play').click();

    //Get background-image url from background-image css prop
    await assertBackgroundImageUrlFromBackgroundCss(page);

    // Open the image filter menu
    await page.locator('[role=toolbar] button[title="Brightness and contrast"]').click();

    // Drag the brightness and contrast sliders around and assert filter values
    await dragBrightnessSliderAndAssertFilterValues(page);
    await dragContrastSliderAndAssertFilterValues(page);
}

/**
 * Drag the brightness slider to max, min, and midpoint and assert the filter values
 * @param {import('@playwright/test').Page} page
 */
async function dragBrightnessSliderAndAssertFilterValues(page) {
    const brightnessSlider = 'div.c-image-controls__slider-wrapper.icon-brightness > input';
    const brightnessBoundingBox = await page.locator(brightnessSlider).boundingBox();
    const brightnessMidX = brightnessBoundingBox.x + brightnessBoundingBox.width / 2;
    const brightnessMidY = brightnessBoundingBox.y + brightnessBoundingBox.height / 2;

    await page.locator(brightnessSlider).hover({trial: true});
    await page.mouse.down();
    await page.mouse.move(brightnessBoundingBox.x + brightnessBoundingBox.width, brightnessMidY);
    await assertBackgroundImageBrightness(page, '500');
    await page.mouse.move(brightnessBoundingBox.x, brightnessMidY);
    await assertBackgroundImageBrightness(page, '0');
    await page.mouse.move(brightnessMidX, brightnessMidY);
    await assertBackgroundImageBrightness(page, '250');
    await page.mouse.up();
}

/**
 * Drag the contrast slider to max, min, and midpoint and assert the filter values
 * @param {import('@playwright/test').Page} page
 */
async function dragContrastSliderAndAssertFilterValues(page) {
    const contrastSlider = 'div.c-image-controls__slider-wrapper.icon-contrast > input';
    const contrastBoundingBox = await page.locator(contrastSlider).boundingBox();
    const contrastMidX = contrastBoundingBox.x + contrastBoundingBox.width / 2;
    const contrastMidY = contrastBoundingBox.y + contrastBoundingBox.height / 2;

    await page.locator(contrastSlider).hover({trial: true});
    await page.mouse.down();
    await page.mouse.move(contrastBoundingBox.x + contrastBoundingBox.width, contrastMidY);
    await assertBackgroundImageContrast(page, '500');
    await page.mouse.move(contrastBoundingBox.x, contrastMidY);
    await assertBackgroundImageContrast(page, '0');
    await page.mouse.move(contrastMidX, contrastMidY);
    await assertBackgroundImageContrast(page, '250');
    await page.mouse.up();
}

/**
 * Gets the filter:brightness value of the current background-image and
 * asserts against an expected value
 * @param {import('@playwright/test').Page} page
 * @param {String} expected The expected brightness value
 */
async function assertBackgroundImageBrightness(page, expected) {
    const backgroundImage = page.locator('.c-imagery__main-image__background-image');

    // Get the brightness filter value (i.e: filter: brightness(500%) => "500")
    const actual = await backgroundImage.evaluate((el) => {
        return el.style.filter.match(/brightness\((\d{1,3})%\)/)[1];
    });
    expect(actual).toBe(expected);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function assertBackgroundImageUrlFromBackgroundCss(page) {
    const backgroundImage = page.locator('.c-imagery__main-image__background-image');
    let backgroundImageUrl = await backgroundImage.evaluate((el) => {
        return window.getComputedStyle(el).getPropertyValue('background-image').match(/url\(([^)]+)\)/)[1];
    });
    let backgroundImageUrl1 = backgroundImageUrl.slice(1, -1); //forgive me, padre
    console.log('backgroundImageUrl1 ' + backgroundImageUrl1);

    let backgroundImageUrl2;
    await expect.poll(async () => {
        // Verify next image has updated
        let backgroundImageUrlNext = await backgroundImage.evaluate((el) => {
            return window.getComputedStyle(el).getPropertyValue('background-image').match(/url\(([^)]+)\)/)[1];
        });
        backgroundImageUrl2 = backgroundImageUrlNext.slice(1, -1); //forgive me, padre

        return backgroundImageUrl2;
    }, {
        message: "verify next image has updated",
        timeout: 7 * 1000
    }).not.toBe(backgroundImageUrl1);
    console.log('backgroundImageUrl2 ' + backgroundImageUrl2);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function panZoomAndAssertImageProperties(page) {
    const imageryHintsText = await page.locator('.c-imagery__hints').innerText();
    expect(expectedAltText).toEqual(imageryHintsText);
    const zoomedBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
    const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;

    // Pan right
    await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX - 200, imageCenterY, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
    const afterRightPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(zoomedBoundingBox.x).toBeGreaterThan(afterRightPanBoundingBox.x);

    // Pan left
    await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX, imageCenterY, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
    const afterLeftPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(afterRightPanBoundingBox.x).toBeLessThan(afterLeftPanBoundingBox.x);

    // Pan up
    await page.mouse.move(imageCenterX, imageCenterY);
    await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX, imageCenterY + 200, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
    const afterUpPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(afterUpPanBoundingBox.y).toBeGreaterThanOrEqual(afterLeftPanBoundingBox.y);

    // Pan down
    await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX, imageCenterY - 200, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
    const afterDownPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(afterDownPanBoundingBox.y).toBeLessThanOrEqual(afterUpPanBoundingBox.y);
}

/**
 * Use the mouse wheel to zoom in or out of an image and assert that the image
 * has successfully zoomed in or out.
 * @param {import('@playwright/test').Page} page
 * @param {number} [factor = 2] The zoom factor. Positive for zoom in, negative for zoom out.
*/
async function mouseZoomOnImageAndAssert(page, factor = 2) {
    // Zoom in
    const originalImageDimensions = await page.locator(backgroundImageSelector).boundingBox();
    await page.locator(backgroundImageSelector).hover({trial: true});
    const deltaYStep = 100; // equivalent to 1x zoom
    await page.mouse.wheel(0, deltaYStep * factor);
    const zoomedBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
    const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;

    // center the mouse pointer
    await page.mouse.move(imageCenterX, imageCenterY);

    // Wait for zoom animation to finish
    await page.locator(backgroundImageSelector).hover({trial: true});
    const imageMouseZoomed = await page.locator(backgroundImageSelector).boundingBox();

    if (factor > 0) {
        expect(imageMouseZoomed.height).toBeGreaterThan(originalImageDimensions.height);
        expect(imageMouseZoomed.width).toBeGreaterThan(originalImageDimensions.width);
    } else {
        expect(imageMouseZoomed.height).toBeLessThan(originalImageDimensions.height);
        expect(imageMouseZoomed.width).toBeLessThan(originalImageDimensions.width);
    }
}

/**
 * Zoom in and out of the image using the buttons, and assert that the image has
 * been successfully zoomed in or out.
 * @param {import('@playwright/test').Page} page
 */
async function buttonZoomOnImageAndAssert(page) {
    // Get initial image dimensions
    const initialBoundingBox = await page.locator(backgroundImageSelector).boundingBox();

    // Zoom in twice via button
    await zoomIntoImageryByButton(page);
    await zoomIntoImageryByButton(page);

    // Get and assert zoomed in image dimensions
    const zoomedInBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
    expect(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

    // Zoom out once via button
    await zoomOutOfImageryByButton(page);

    // Get and assert zoomed out image dimensions
    const zoomedOutBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(zoomedOutBoundingBox.height).toBeLessThan(zoomedInBoundingBox.height);
    expect(zoomedOutBoundingBox.width).toBeLessThan(zoomedInBoundingBox.width);

    // Zoom out again via button, assert against the initial image dimensions
    await zoomOutOfImageryByButton(page);
    const finalBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(finalBoundingBox).toEqual(initialBoundingBox);
}

/**
 * Gets the filter:contrast value of the current background-image and
 * asserts against an expected value
 * @param {import('@playwright/test').Page} page
 * @param {String} expected The expected contrast value
 */
async function assertBackgroundImageContrast(page, expected) {
    const backgroundImage = page.locator('.c-imagery__main-image__background-image');

    // Get the contrast filter value (i.e: filter: contrast(500%) => "500")
    const actual = await backgroundImage.evaluate((el) => {
        return el.style.filter.match(/contrast\((\d{1,3})%\)/)[1];
    });
    expect(actual).toBe(expected);
}

/**
 * Use the '+' button to zoom in. Hovers first if the toolbar is not visible
 * and waits for the zoom animation to finish afterwards.
 * @param {import('@playwright/test').Page} page
 */
async function zoomIntoImageryByButton(page) {
    // FIXME: There should only be one set of imagery buttons, but there are two?
    const zoomInBtn = page.locator("[role='toolbar'][aria-label='Image controls'] .t-btn-zoom-in").nth(0);
    const backgroundImage = page.locator(backgroundImageSelector);
    if (!(await zoomInBtn.isVisible())) {
        await backgroundImage.hover({trial: true});
    }

    await zoomInBtn.click();
    await waitForAnimations(backgroundImage);
}

/**
 * Use the '-' button to zoom out. Hovers first if the toolbar is not visible
 * and waits for the zoom animation to finish afterwards.
 * @param {import('@playwright/test').Page} page
 */
async function zoomOutOfImageryByButton(page) {
    // FIXME: There should only be one set of imagery buttons, but there are two?
    const zoomOutBtn = page.locator("[role='toolbar'][aria-label='Image controls'] .t-btn-zoom-out").nth(0);
    const backgroundImage = page.locator(backgroundImageSelector);
    if (!(await zoomOutBtn.isVisible())) {
        await backgroundImage.hover({trial: true});
    }

    await zoomOutBtn.click();
    await waitForAnimations(backgroundImage);
}

/**
 * Use the reset button to reset image pan and zoom. Hovers first if the toolbar is not visible
 * and waits for the zoom animation to finish afterwards.
 * @param {import('@playwright/test').Page} page
 */
async function resetImageryPanAndZoom(page) {
    // FIXME: There should only be one set of imagery buttons, but there are two?
    const panZoomResetBtn = page.locator("[role='toolbar'][aria-label='Image controls'] .t-btn-zoom-reset").nth(0);
    const backgroundImage = page.locator(backgroundImageSelector);
    if (!(await panZoomResetBtn.isVisible())) {
        await backgroundImage.hover({trial: true});
    }

    await panZoomResetBtn.click();
    await waitForAnimations(backgroundImage);
}
