import { test, expect } from '@playwright/test';

function unique() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

test('borrowing and returning a book updates availability and history', async ({ page }) => {
  const id = unique();
  const title = `E2Eテスト本 ${id}`;
  const memberName = `E2Eテスト会員 ${id}`;
  const memberEmail = `e2e-${id}@example.com`;

  await page.goto('/');

  await page.getByRole('button', { name: '本を追加' }).click();
  const bookForm = page.locator('form.book-form');
  await bookForm.getByPlaceholder('タイトル', { exact: true }).fill(title);
  await bookForm.getByPlaceholder('著者').fill('E2E Author');
  await bookForm.getByPlaceholder('ISBN').fill(`isbn-${id}`);
  await bookForm.getByPlaceholder('冊数').fill('1');
  await bookForm.getByRole('button', { name: '登録' }).click();

  const bookRow = page.getByRole('row', { name: new RegExp(title) });
  await expect(bookRow).toContainText('1 / 1');

  await page.getByRole('link', { name: '会員' }).click();
  await page.getByPlaceholder('名前').fill(memberName);
  await page.getByPlaceholder('メールアドレス').fill(memberEmail);
  await page.getByRole('button', { name: '会員を追加' }).click();
  await expect(page.getByRole('row', { name: new RegExp(memberName) })).toBeVisible();

  await page.getByRole('link', { name: '蔵書' }).click();
  const bookRowAfterNav = page.getByRole('row', { name: new RegExp(title) });
  await bookRowAfterNav.getByRole('combobox').selectOption({ label: memberName });
  await bookRowAfterNav.getByRole('button', { name: '貸出' }).click();

  await expect(bookRowAfterNav).toContainText('0 / 1');
  await expect(bookRowAfterNav.getByRole('button', { name: '貸出' })).toBeDisabled();

  await page.getByRole('link', { name: '貸出' }).click();
  const loanRow = page.getByRole('row', { name: new RegExp(title) });
  await expect(loanRow).toContainText('貸出中');
  await loanRow.getByRole('button', { name: '返却' }).click();

  const activeTable = page.locator('table').nth(0);
  const historyTable = page.locator('table').nth(1);
  await expect(activeTable).not.toContainText(title);
  await expect(historyTable).toContainText(title);

  await page.getByRole('link', { name: '蔵書' }).click();
  await expect(page.getByRole('row', { name: new RegExp(title) })).toContainText('1 / 1');
});

test('shows a validation message when trying to borrow without selecting a member', async ({ page }) => {
  const id = unique();
  const title = `E2E未選択テスト ${id}`;

  await page.goto('/');
  await page.getByRole('button', { name: '本を追加' }).click();
  const bookForm = page.locator('form.book-form');
  await bookForm.getByPlaceholder('タイトル', { exact: true }).fill(title);
  await bookForm.getByPlaceholder('著者').fill('E2E Author');
  await bookForm.getByPlaceholder('ISBN').fill(`isbn-${id}`);
  await bookForm.getByRole('button', { name: '登録' }).click();

  const bookRow = page.getByRole('row', { name: new RegExp(title) });
  await bookRow.getByRole('button', { name: '貸出' }).click();

  await expect(page.getByText('貸出先の会員を選択してください')).toBeVisible();
});
