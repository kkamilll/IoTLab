export const rentalAgreementTemplate = ({ customerInfo, items, startDate, endDate, today }) => `
  <div style="
      font-family: 'Times New Roman', Times, serif;
      font-size: 12px;
      padding: 25px;
      line-height: 1.6;
      background: #ffffff;
      color: #000;
      -webkit-font-smoothing: antialiased;
      box-sizing: border-box;
  ">

    <h1 style="text-align:center; font-size:18px; font-weight:bold; margin: 0 0 10px 0; text-transform: uppercase;">
      Rental Agreement
    </h1>
    <p style="text-align:right; margin: 0 0 20px 0;">Poznań, Date: ______________________</p>

    <h3 style="margin: 10px 0;">Borrower Information (Student):</h3>
    <div style="display: flex; flex-wrap: wrap; margin-bottom: 15px;">
      <div style="flex: 1; min-width: 250px; padding-right: 20px;">
        <p>
          <b>First and last name</b>: ${customerInfo.firstName} ${customerInfo.lastName}<br/>
          <b>Index</b>: ${customerInfo.index}<br/>
          <b>Semester</b>: ${customerInfo.semester}<br/>
          <b>Year of study</b>: ${customerInfo.yearOfStudy}
        </p>
      </div>
      <div style="flex: 1; min-width: 250px;">
        <p>
          <b>Specialization</b>: ${customerInfo.specialization}<br/>
          <b>Field of study</b>: ${customerInfo.fieldOfStudy}<br/>
          <b>Phone</b>: ${customerInfo.phoneNumber}<br/>
          <b>Email</b>: ${customerInfo.email}
        </p>
      </div>
    </div>

    <p style="margin: 10px 0;">
      This agreement certifies that on <b>${today}</b>, the Borrower received from the Laboratory the following equipment:
    </p>

    <table style="width:100%; border-collapse: collapse; border-spacing:0; font-size:11px;">
      <thead>
        <tr>
          <th style="text-align:left; padding:8px; background-color:#eee; border:1px solid #000;">Item</th>
          <th style="text-align:center; padding:8px; background-color:#eee; border:1px solid #000; width:120px;">Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td style="padding:8px; border:1px solid #000;">${i.productName}</td>
            <td style="padding:8px; border:1px solid #000; text-align:center;">${i.quantity}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <ol style="margin: 20px 0; padding: 0 0 0 20px; font-size: 12px;">
      <li>The above-mentioned items were borrowed for the purpose of: <b>${customerInfo.purpose}</b>.</li>
      <li>I agree to return the requested items by: <b>${endDate}</b>.</li>
      <li>In the event of loss of the borrowed equipment, I agree to repurchase it.</li>
    </ol>

    <p style="margin-top:30px;">
      By signing this document, the Borrower confirms that they have read, understood, and agreed to the above conditions.
    </p>

    <div style="display: flex; justify-content: space-between; margin-top: 60px;">
      <div style="text-align: left;">
        _______________________________<br/>
        Borrower’s Signature
      </div>
      <div style="text-align: right;">
        _______________________________<br/>
        Supervisor’s Signature
      </div>
    </div>
  </div>
`;
