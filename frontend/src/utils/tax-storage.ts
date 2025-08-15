import type { TaxCategory } from './tax-calculations';

const TAX_CATEGORIES_KEY = 'budgeter_tax_categories';

export interface TaxCategoryMapping {
  [transactionId: string]: TaxCategory;
}

export function saveTaxCategories(categories: TaxCategoryMapping): void {
  try {
    console.log('Saving tax categories to localStorage:', categories);
    localStorage.setItem(TAX_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to save tax categories to localStorage:', error);
  }
}

export function loadTaxCategories(): TaxCategoryMapping {
  try {
    const stored = localStorage.getItem(TAX_CATEGORIES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load tax categories from localStorage:', error);
  }
  return {};
}

export function updateTaxCategory(transactionId: string, category: TaxCategory): void {
  const categories = loadTaxCategories();
  if (category === 'none' || category === undefined) {
    delete categories[transactionId];
  } else {
    categories[transactionId] = category;
  }
  saveTaxCategories(categories);
}

export function getTaxCategory(transactionId: string): TaxCategory {
  const categories = loadTaxCategories();
  return categories[transactionId] || 'none';
}

export function clearAllTaxCategories(): void {
  try {
    localStorage.removeItem(TAX_CATEGORIES_KEY);
  } catch (error) {
    console.error('Failed to clear tax categories from localStorage:', error);
  }
}

export function exportTaxCategories(): string {
  const categories = loadTaxCategories();
  return JSON.stringify(categories, null, 2);
}

export function importTaxCategories(jsonString: string): boolean {
  try {
    const categories = JSON.parse(jsonString);
    saveTaxCategories(categories);
    return true;
  } catch (error) {
    console.error('Failed to import tax categories:', error);
    return false;
  }
}
