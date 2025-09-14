// rentalAgreementTemplate.js
export const rentalAgreementTemplate = ({ ownerName, institution, items, startDate, endDate }) => `
RENTAL AGREEMENT

This agreement is made between ${institution} (the "Provider") and ${ownerName} (the "Renter").

1. Rental Period
   Start Date: ${startDate}
   End Date: ${endDate}

2. Rented Items
${items.map((item, i) => `${i + 1}. ${item.productName} — Quantity: ${item.quantity}`).join("\n")}

3. Obligations of the Renter
- All rented items must be returned in good condition by the end date.
- The Renter is responsible for any damage or loss of rented items.
- Items must only be used for their intended purpose.

4. Legal
- This agreement is legally binding under applicable law.
- Failure to return items may result in financial or legal consequences.

Signature: ___________________________

Date: ________________________________
`;
