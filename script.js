import got from 'got';
import dotenv from 'dotenv';
import { google } from 'googleapis';


const sheets = google.sheets('v4')
dotenv.config();


//Fetches all the staff who are on holiday and adds their full names to an array. If they have a preferred name, it also adds that to the array.
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
  //console.log(rawBambooHR);
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

  return filteredBambooHR;
}

/**
 * Gain authorization for accessing Google Drive.
 * @returns {Promise<void>} A promise that resolves when authorization is successful.
 */
const authGoogle = async () => {
  /* Create a new auth client */
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

  /* Set the credentials */
  google.options({ auth })
}

/**
 * Retrieves the marketing calendar from a specified spreadsheet.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of objects representing the filtered tasks from the marketing calendar.
 * @throws {Error} - Throws an error if no tasks are found in the marketing calendar.
 */
const getAnalysts = async () => {
  /* Get the marketing calendar */
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: "1IeVtTwyFNxn4L8yObrjDHIxNSxhEPH_dPzUblv1e_84",
    range: "'Master AOL'!A1:H",
    valueRenderOption: 'FORMATTED_VALUE'
  })

  /* Map headers to values */
  const headers = res.data.values[1]
  /* Map values to objects */
  const returnValues = {};
  const values = res.data.values.slice(2)
  .filter((row) => new Boolean(row[0]) == true && new Boolean(row[3]) == true && new Boolean(row[6]) == true && new Boolean(row[7]) == true)
  .map((row) => {
    returnValues[row[0]] = [row[3], row[6], row[7]];
    return;
  });
  return returnValues;
}

// Actually runs the functions

// const onHoliday = [ 'Callum Earnshaw', 'Nabil Miah', 'Romario Gauntlet' ];

const onHoliday = await filterStaff();

await authGoogle();
const clientAnalysts = await getAnalysts();

for (const client in clientAnalysts) {
  let score = 0;
  for (let i = 0; i < clientAnalysts[client].length; i++) {
    if (onHoliday.includes(clientAnalysts[client][i])) {
      score++;
    }
    //console.log(client, score);
  }
  if (score == clientAnalysts[client].length) {
    // console.log(client);
    // console.log(clientAnalysts[client]);
  }
}

//Email sending

