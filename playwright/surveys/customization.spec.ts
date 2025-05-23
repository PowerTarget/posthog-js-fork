import { pollUntilEventCaptured } from '../utils/event-capture-utils'
import { expect, test } from '../utils/posthog-playwright-test-base'
import { start } from '../utils/setup'

const startOptions = {
    options: {},
    decideResponseOverrides: {
        surveys: true,
    },
    url: './playground/cypress/index.html',
}

const openTextQuestion = {
    type: 'open',
    question: 'What feedback do you have for us?',
    description: 'plain text description',
    id: 'open_text_1',
}

const linkQuestionWithHTMLContentType = {
    type: 'link',
    question: 'Book an interview with us',
    link: 'https://posthog.com',
    description: '<h2>html description</h2>',
    descriptionContentType: 'html',
    id: 'link_html_1',
}

const linkQuestionWithNoContentType = {
    type: 'link',
    question: 'Book an interview with us',
    link: 'https://posthog.com',
    description: '<h2>html description</h2>',
    id: 'link_no_content_1',
}

const linkQuestionWithTextContentType = {
    type: 'link',
    question: 'Book an interview with us',
    link: 'https://posthog.com',
    description: '<h2>html description</h2>',
    descriptionContentType: 'text',
    id: 'link_text_1',
}

const appearanceWithThanks = {
    displayThankYouMessage: true,
    thankyouMessageHeader: 'Thanks!',
    thankyouMessageBody: 'We appreciate your feedback.',
}

const black = 'rgb(0, 0, 0)'
const white = 'rgb(255, 255, 255)'

test.describe('surveys - customization', () => {
    test('automatically sets text color based on background color', async ({ page, context }) => {
        const surveysAPICall = page.route('**/surveys/**', async (route) => {
            await route.fulfill({
                json: {
                    surveys: [
                        {
                            id: '123',
                            name: 'Test survey',
                            type: 'popover',
                            start_date: '2021-01-01T00:00:00Z',
                            questions: [openTextQuestion],
                            appearance: {
                                backgroundColor: '#000000',
                                submitButtonColor: '#ffffff',
                            },
                        },
                    ],
                },
            })
        })

        await start(startOptions, page, context)
        await surveysAPICall

        await expect(page.locator('.PostHogSurvey123').locator('.survey-form')).toBeVisible()
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question')).toHaveText(
            'What feedback do you have for us?'
        )
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question-description')).toHaveText(
            'plain text description'
        )

        await expect(page.locator('.PostHogSurvey123').locator('.footer-branding')).toBeVisible()

        await expect(page.locator('.PostHogSurvey123').locator('.survey-question')).toHaveCSS('background-color', black)
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question')).toHaveCSS('color', white)

        await page.locator('.PostHogSurvey123').locator('textarea').type('This is great!')

        await page.locator('.PostHogSurvey123').locator('.form-submit').click()

        await pollUntilEventCaptured(page, 'survey sent')
    })

    test('does not show posthog logo if whiteLabel exists', async ({ page, context }) => {
        const surveysAPICall = page.route('**/surveys/**', async (route) => {
            await route.fulfill({
                json: {
                    surveys: [
                        {
                            id: '123',
                            name: 'Test survey',
                            type: 'popover',
                            start_date: '2021-01-01T00:00:00Z',
                            questions: [openTextQuestion],
                            appearance: { whiteLabel: true },
                        },
                    ],
                },
            })
        })

        await start(startOptions, page, context)
        await surveysAPICall

        await expect(page.locator('.PostHogSurvey123').locator('.survey-form')).toBeVisible()
        await expect(page.locator('.PostHogSurvey123').locator('.footer-branding')).not.toBeVisible()
    })

    test('allows html customization for question and thank you element description', async ({ page, context }) => {
        const surveysAPICall = page.route('**/surveys/**', async (route) => {
            await route.fulfill({
                json: {
                    surveys: [
                        {
                            id: '123',
                            name: 'Test survey',
                            type: 'popover',
                            start_date: '2021-01-01T00:00:00Z',
                            questions: [linkQuestionWithHTMLContentType],
                        },
                    ],
                },
            })
        })

        await start(startOptions, page, context)
        await surveysAPICall

        await expect(page.locator('.PostHogSurvey123').locator('.survey-form')).toBeVisible()
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question')).toHaveText(
            'Book an interview with us'
        )
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question-description h2')).toHaveText(
            'html description'
        )
    })

    test('allows html customization for question missing the descriptionContentType field (backfilling against surveys made before we introduced this field)', async ({
        page,
        context,
    }) => {
        const surveysAPICall = page.route('**/surveys/**', async (route) => {
            await route.fulfill({
                json: {
                    surveys: [
                        {
                            id: '123',
                            name: 'Test survey',
                            type: 'popover',
                            start_date: '2021-01-01T00:00:00Z',
                            questions: [linkQuestionWithNoContentType],
                        },
                    ],
                },
            })
        })

        await start(startOptions, page, context)
        await surveysAPICall

        await expect(page.locator('.PostHogSurvey123').locator('.survey-form')).toBeVisible()
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question')).toHaveText(
            'Book an interview with us'
        )
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question-description h2')).toHaveText(
            'html description'
        )
    })

    test('allows html customization for thank you message body', async ({ page, context }) => {
        const surveysAPICall = page.route('**/surveys/**', async (route) => {
            await route.fulfill({
                json: {
                    surveys: [
                        {
                            id: '123',
                            name: 'Test survey',
                            type: 'popover',
                            start_date: '2021-01-01T00:00:00Z',
                            questions: [openTextQuestion],
                            appearance: {
                                ...appearanceWithThanks,
                                thankYouMessageDescription: '<h3>html thank you message!</h3>',
                                thankYouMessageDescriptionContentType: 'html',
                            },
                        },
                    ],
                },
            })
        })

        await start(startOptions, page, context)
        await surveysAPICall

        await expect(page.locator('.PostHogSurvey123').locator('.survey-form')).toBeVisible()
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question')).toHaveText(
            'What feedback do you have for us?'
        )
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question-description')).toHaveText(
            'plain text description'
        )
        await page.locator('.PostHogSurvey123').locator('textarea').type('This is great!')
        await page.locator('.PostHogSurvey123').locator('.form-submit').click()
        await expect(page.locator('.PostHogSurvey123').locator('.thank-you-message-body h3')).toHaveText(
            'html thank you message!'
        )
        await pollUntilEventCaptured(page, 'survey sent')
    })

    test('does not render html customization for question descriptions if the question.survey-question-descriptionContentType does not permit it', async ({
        page,
        context,
    }) => {
        const surveysAPICall = page.route('**/surveys/**', async (route) => {
            await route.fulfill({
                json: {
                    surveys: [
                        {
                            id: '123',
                            name: 'Test survey',
                            type: 'popover',
                            start_date: '2021-01-01T00:00:00Z',
                            questions: [linkQuestionWithTextContentType],
                        },
                    ],
                },
            })
        })

        await start(startOptions, page, context)
        await surveysAPICall

        await expect(page.locator('.PostHogSurvey123').locator('.survey-form')).toBeVisible()
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question')).toHaveText(
            'Book an interview with us'
        )
        await expect(page.locator('.PostHogSurvey123').locator('.survey-question-description')).toHaveText(
            // the escaped html is the content
            '<h2>html description</h2>'
        )
    })

    test('does not render html customization for thank you message body if the appearance.thankYouMessageDescriptionContentType does not permit it', async ({
        page,
        context,
    }) => {
        const surveysAPICall = page.route('**/surveys/**', async (route) => {
            await route.fulfill({
                json: {
                    surveys: [
                        {
                            id: '123',
                            name: 'Test survey',
                            type: 'popover',
                            start_date: '2021-01-01T00:00:00Z',
                            questions: [openTextQuestion],
                            appearance: {
                                ...appearanceWithThanks,
                                thankYouMessageDescription: '<h3>html thank you message!</h3>',
                                thankYouMessageDescriptionContentType: 'text',
                            },
                        },
                    ],
                },
            })
        })

        await start(startOptions, page, context)
        await surveysAPICall

        await expect(page.locator('.PostHogSurvey123').locator('.survey-form')).toBeVisible()
        await page.locator('.PostHogSurvey123').locator('textarea').type('This is great!')
        await page.locator('.PostHogSurvey123').locator('.form-submit').click()
        await expect(page.locator('.PostHogSurvey123').locator('.thank-you-message-body')).toHaveText(
            // the escaped html is the content
            '<h3>html thank you message!</h3>'
        )
        await pollUntilEventCaptured(page, 'survey sent')
    })
})
