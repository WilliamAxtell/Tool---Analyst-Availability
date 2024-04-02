import got from 'got';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import sgMail from '@sendgrid/mail';
import schedule from 'node-schedule';

const sheets = google.sheets('v4');
dotenv.config();


//Fetches all the staff who are on holiday or sick and adds their full names to an array. If they have a preferred name, it also adds that to the array.
const fetchStaff = async () => {
  const response = await got.post('https://europe-west2-bamboo-nine-internal-tools.cloudfunctions.net/staff', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.BAMBOONINE_CLIENT_TOKEN
    },
    responseType: 'json'
  })

  const data = response.body
  return data
}

const filterStaff = async () => {
  const rawBambooHR = await fetchStaff();
  const filteredBambooHR = [];

  for (let i = 0; i < rawBambooHR.length; i++) {
    const employee = rawBambooHR[i];
    if (employee.deparment == "Paid Media" && employee.holiday == true) {
      const employeeName = employee.firstName + " " + employee.lastName;
      filteredBambooHR.push(employeeName);
      if (employee.preferredName != null && employee.preferredName != employee.firstName) {
      const employeeNickname = employee.preferredName + " " + employee.lastName;
      filteredBambooHR.push(employeeNickname);
      }
    }
  }

  //return [ 'Callum Earnshaw', 'Nabil Miah', 'Romario Gauntlet' ];
  return filteredBambooHR;
}

//Fetches all the paid media clients and their respective analysts
const authGoogle = async () => {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
    credentials: {
      client_email: process.env.CRED_CLIENT_EMAIL,
      private_key: JSON.parse(process.env.CRED_PRIVATE_KEY).value,
      client_id: process.env.CRED_CLIENT_ID,
      type: process.env.CRED_TYPE,
      project_id: process.env.CRED_PROJECT_ID,
      private_key_id: process.env.CRED_PRIVATE_KEY_ID,
      auth_uri: process.env.CRED_AUTH_URI,
      token_uri: process.env.CRED_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.CRED_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.CRED_CLIENT_X509_CERT_URL
    }
  })

  google.options({ auth })
}

const getAnalysts = async () => {
  await authGoogle();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: "1IeVtTwyFNxn4L8yObrjDHIxNSxhEPH_dPzUblv1e_84",
    range: "'Master AOL'!A1:Z",
    valueRenderOption: 'FORMATTED_VALUE'
  })

  const headers = res.data.values[1];
  const primaryAnalyst = headers.indexOf("Paid Media Analyst");
  const secondaryAnalyst = headers.indexOf("Paid Media Secondary Analyst");
  const tertiaryAnalyst = headers.indexOf("Paid Media Tertiary Analyst");

  const returnValues = {};
  const values = res.data.values.slice(2)
  .filter((row) => new Boolean(row[0]) == true && new Boolean(row[primaryAnalyst]) == true && new Boolean(row[secondaryAnalyst]) == true && new Boolean(row[tertiaryAnalyst]) == true)
  .map((row) => {
    returnValues[row[0]] = [row[primaryAnalyst], row[secondaryAnalyst], row[tertiaryAnalyst]];
    return;
  });

  return returnValues;
}

// Builds the list of client who have no anaylst on duty
const buildSendList = async () => {
  let sendList = ``;

  const onHoliday = await filterStaff();
  const clientAnalysts = await getAnalysts();

  for (const client in clientAnalysts) {
    let score = 0;
    for (let i = 0; i < clientAnalysts[client].length; i++) {
      if (onHoliday.includes(clientAnalysts[client][i])) {
        score++;
      }
    }
    if (score == clientAnalysts[client].length) {
      sendList += `<li>${client}</li>`;
    }
  }
  
  if (sendList != ``) {
    sendEmail(sendList);
  } else {
    console.log("No alert needed today");
  }
}

//Sends an email to HoPM if there are any clients without an analyst on duty
const sendEmail = (list) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: 'paidmedia@bamboonine.co.uk',
    from: 'data@bamboonine.co.uk',
    subject: 'Accounts without an analyst on duty',
    //text: 'and easy to do anywhere, even with Node.js',
    html: `<p>Good Morning, Zak!</p>
          <p>There are clients without an analyst on duty today:</p>
          <ul>
            ${list}
          </ul>
          <p>Kind Regards,</p>
          <p>The Data Team</p>`,
  };

  (async () => {
    try {
      await sgMail.send(msg);
      console.log("email sent successfully");
    } catch (error) {
      console.error(error);

      if (error.response) {
        console.error(error.response.body)
      }
    }
  })();
}

console.log("scheduler running");

const j = schedule.scheduleJob({hour: 8, minute: 45}, () => {
  console.log("job scheduled");
  buildSendList();
});
