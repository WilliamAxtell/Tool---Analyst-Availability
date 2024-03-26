import got from 'got';
import dotenv from 'dotenv';
import { get } from 'http';
dotenv.config();

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

console.log(filteredBambooHR);


//Script to get data from Google Sheets

/**
 * Gets cell values from a Spreadsheet.
 * @param {string} spreadsheetId The spreadsheet ID.
 * @param {string} range The sheet range.
 * @return {obj} spreadsheet information
 */
const spreadsheetId = "1IeVtTwyFNxn4L8yObrjDHIxNSxhEPH_dPzUblv1e_84";
const range = "Master AOL!A3:C";

async function getValues(spreadsheetId, range) {
    // const {GoogleAuth} = require('google-auth-library');
    // const {google} = require('googleapis');
  
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });
  
    const service = google.sheets({version: 'v4', auth});
    try {
      const result = await service.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      const numRows = result.data.values ? result.data.values.length : 0;
      console.log(`${numRows} rows retrieved.`);
      return result;
    } catch (err) {
      // TODO (developer) - Handle exception
      throw err;
    }
  }

 // getValues(spreadsheetId, range);
