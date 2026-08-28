import { expect, test } from '@playwright/test'

test('completes the Life OS V1 growth loop and persists it', async ({ page }) => {
  const suffix = Date.now().toString().slice(-6)
  const goalTitle = `Improve English ${suffix}`
  const projectTitle = `Oral Defense Preparation ${suffix}`
  const taskTitle = `Practice speaking for 30 minutes ${suffix}`
  const achievementTitle = `Completed first oral defense in English ${suffix}`

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Good morning' })).toBeVisible()

  await page.getByRole('link', { name: 'Goals' }).first().click()
  await page.getByRole('button', { name: 'New goal' }).click()
  await page.getByLabel('Title').fill(goalTitle)
  await page.getByLabel('Description').fill('Handle course presentations, oral defenses and research communication.')
  await page.getByLabel('Category').selectOption('English')
  await page.getByRole('button', { name: 'Save goal' }).click()
  await expect(page.getByRole('heading', { name: goalTitle })).toBeVisible()

  await page.getByRole('button', { name: /Add project/ }).click()
  const projectForm = page.getByPlaceholder('Project title').locator('..')
  await projectForm.getByPlaceholder('Project title').fill(projectTitle)
  await projectForm.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText(projectTitle, { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /Add task/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Title').fill(taskTitle)
  await dialog.getByLabel('Project').selectOption({ label: projectTitle })
  await dialog.getByLabel('Estimate (min)').fill('30')
  await dialog.getByRole('button', { name: 'Save task' }).click()
  await expect(dialog).toBeHidden()
  await page.screenshot({ path: 'test-results/goal-detail-desktop.png', fullPage: true })

  await page.getByRole('link', { name: 'Dashboard' }).first().click()
  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: `Complete ${taskTitle}` }).click()
  await expect(page.getByRole('button', { name: `Mark ${taskTitle} todo` })).toBeVisible()
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true })

  await page.getByRole('link', { name: 'Calendar' }).first().click()
  await expect(page.locator('.fc-event').filter({ hasText: taskTitle })).toBeVisible()
  const milestoneTitle = `First professor meeting ${suffix}`
  await page.getByRole('button', { name: /Milestone/ }).click()
  await dialog.getByLabel('Title').fill(milestoneTitle)
  await dialog.getByLabel('Goal').selectOption({ label: goalTitle })
  await dialog.getByRole('button', { name: 'Save milestone' }).click()
  await page.locator('.fc-event').filter({ hasText: milestoneTitle }).click()
  await expect(dialog.getByRole('heading', { name: 'Edit milestone' })).toBeVisible()
  await dialog.getByLabel('Title').fill(`${milestoneTitle} updated`)
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.locator('.fc-event').filter({ hasText: `${milestoneTitle} updated` })).toBeVisible()
  await page.screenshot({ path: 'test-results/calendar-desktop.png', fullPage: true })

  await page.getByRole('link', { name: 'Achievements' }).first().click()
  await page.getByRole('button', { name: 'Add achievement' }).click()
  await dialog.getByLabel('Title').fill(achievementTitle)
  await dialog.getByLabel('Goal').selectOption({ label: goalTitle })
  await dialog.getByRole('button', { name: 'Save achievement' }).click()
  await expect(page.getByText(achievementTitle, { exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/achievements-desktop.png', fullPage: true })

  await page.getByRole('link', { name: 'Journal' }).first().click()
  await page.getByLabel('What is on your mind?').fill('Today I practiced deliberately and moved the larger goal forward.')
  await page.getByRole('group', { name: 'Mood' }).getByRole('button', { name: '4' }).click()
  await page.getByRole('group', { name: 'Energy' }).getByRole('button', { name: '4' }).click()
  await page.getByRole('button', { name: 'Save journal' }).click()
  await expect(page.getByText('Journal entry saved.')).toBeVisible()
  await expect(page.getByText('Today I practiced deliberately and moved the larger goal forward.')).toBeVisible()
  await page.screenshot({ path: 'test-results/journal-desktop.png', fullPage: true })

  await page.getByRole('link', { name: 'Dashboard' }).first().click()
  await expect(page.getByText(achievementTitle, { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  await expect(page.getByText(achievementTitle, { exact: true })).toBeVisible()
})

test('keeps the primary dashboard usable at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Good morning' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText("Today's focus")).toBeVisible()
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true })
})

test('switches the whole interface to Chinese in one click and remembers the choice', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Good morning' })).toBeVisible()

  await page.getByRole('button', { name: 'Switch to Chinese' }).click()
  await expect(page.getByRole('heading', { name: '早上好' })).toBeVisible()
  await expect(page.getByRole('link', { name: '目标' }).first()).toBeVisible()
  await expect(page.getByText('今日重点')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: '早上好' })).toBeVisible()
  await page.getByRole('link', { name: '日历' }).first().click()
  await expect(page.getByRole('heading', { name: '日历' })).toBeVisible()
  await page.screenshot({ path: 'test-results/calendar-chinese-desktop.png', fullPage: true })

  await page.getByRole('button', { name: 'Switch to English' }).click()
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
})

test('deletes one weight entry and recalculates the current metric', async ({ page }) => {
  await page.goto('/goals/demo-goal-health')
  await expect(page.getByRole('heading', { name: 'Weight Loss' })).toBeVisible()
  const metrics = page.locator('.card').filter({ has: page.getByRole('heading', { name: 'Metrics' }) })
  await expect(metrics.locator('.metric-history > div')).toHaveCount(4)
  await page.screenshot({ path: 'test-results/metric-delete-controls.png', fullPage: true })

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('update the goal’s current metric')
    await dialog.accept()
  })
  await metrics.getByRole('button', { name: /Delete metric entry.*99.8 kg/ }).click()

  await expect(metrics.locator('.metric-history > div')).toHaveCount(3)
  await expect(page.getByText('Current metric').locator('..')).toContainText('100.4 kg')
  await page.reload()
  await expect(metrics.locator('.metric-history > div')).toHaveCount(3)
  await expect(page.getByText('Current metric').locator('..')).toContainText('100.4 kg')
})

test('edits saved journals and thoughts while retaining edit times', async ({ page }) => {
  await page.goto('/journal')
  const journalText = `Journal ${Date.now()}`
  await page.getByLabel('What is on your mind?').fill(journalText)
  await page.getByRole('button', { name: 'Save journal' }).click()
  await page.getByRole('button', { name: /Open journal entry/ }).filter({ hasText: journalText }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Edit journal entry' })).toBeVisible()
  await dialog.getByLabel('What is on your mind?').fill(`${journalText} edited`)
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText(`${journalText} edited`)).toBeVisible()

  await page.getByRole('button', { name: 'Capture thought' }).click()
  await dialog.getByLabel('Title').fill('Editable thought')
  await dialog.getByLabel('Thought').fill('First version')
  await dialog.getByRole('button', { name: 'Save thought' }).click()
  await page.getByRole('button', { name: /Open thought.*Editable thought/ }).click()
  await expect(dialog.getByRole('heading', { name: 'Edit thought' })).toBeVisible()
  await dialog.getByLabel('Thought').fill('Second version')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await page.getByRole('button', { name: /Open thought.*Editable thought/ }).click()
  await expect(dialog.getByText('Edit history')).toBeVisible()
  await expect(dialog.getByText('1 edits')).toBeVisible()
  await page.screenshot({ path: 'test-results/journal-edit-history.png', fullPage: true })
})

test('auto-saves the task notes scratchpad and keeps review and charts removed', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Weight trend')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Weekly Review' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Task Notes' }).first().click()
  const memo = `Loose task notes ${Date.now()}`
  await page.getByLabel('Your task scratchpad').fill(memo)
  await expect(page.getByText(/Last saved/)).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Your task scratchpad')).toHaveValue(memo)
  await page.screenshot({ path: 'test-results/task-notes-desktop.png', fullPage: true })
})
