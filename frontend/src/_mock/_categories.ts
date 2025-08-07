export const categories = [
  { "id": "gas", "label": "Gas" },
  { "id": "groceries", "label": "Groceries" },
  { "id": "dining", "label": "Dining & Restaurants" },
  { "id": "entertainment", "label": "Entertainment" },
  { "id": "shopping", "label": "Shopping" },
  { "id": "travel", "label": "Travel" },
  { "id": "transportation", "label": "Transportation" },
  { "id": "utilities", "label": "Utilities" },
  { "id": "health_fitness", "label": "Health & Fitness" },
  { "id": "education", "label": "Education" },
  { "id": "personal_care", "label": "Personal Care" },
  { "id": "home_garden", "label": "Home & Garden" },
  { "id": "automotive", "label": "Automotive" },
  { "id": "insurance", "label": "Insurance" },
  { "id": "charity_donations", "label": "Charity & Donations" },
  { "id": "miscellaneous", "label": "Miscellaneous" },
  { "id": "income", "label": "Income" }
]

const plaidMatches = {
  'INCOME*': 'income',
  'GENERAL_MERCHANDISE*': 'shopping',
  'ENTERTAINMENT*': 'entertainment',
  'LOAN_PAYMENT_CAR*': 'automotive',
  'LOAN_PAYMENT_CREDIT*': 'miscellaneous',
  'BANK_FEES*' : 'miscellaneous', 
  'FOOD_AND_DRINK*': 'dining',
  'TRANSPORTATION_GAS': 'gas',
  'TRANSPORTATION*': 'transportation',
  'TRAVEL*': 'travel',
  'RENT_AND_UTILITIES_RENT': 'home_garden',
  'RENT_AND_UTILITIES*': 'utilities',
  'HOME_IMPROVEMENT*': 'home_garden',
  'MEDICAL*': 'health_fitness',
  'PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS': 'health_fitness',
  'PERSONAL_CARE*': 'personal_care',
  'GENERAL_SERVICES_EDUCATION': 'education',
  'GENERAL_SERVICES_INSURANCE': 'insurance',
  'GENERAL_SERVICES*': 'miscellaneous',
  'GOVERNMENT_AND_NON_PROFIT_DONATIONS': 'charity_donations',
  'GOVERNMENT_AND_NON_PROFIT*': 'miscellaneous'
}

function matchesPattern(pattern: string, input: string) {
  const escaped = pattern.replace(/[-[\]/{}()+?.\\^$|]/g, '\\$&'); // escape regex specials
  const regexPattern = '^' + escaped.replace(/\*/g, '.*') + '$';   // convert * to .*
  const regex = new RegExp(regexPattern);
  return regex.test(input);
}

export const getCategoryFromPlaid = (plaidCategory: string): string => {
  if (plaidCategory) {
    for (const [key, value] of Object.entries(plaidMatches)) {
      if (matchesPattern(key, plaidCategory)) {
        return value;
      }
    }
  }
  
  return 'miscellaneous'; // Default category if no match found
}