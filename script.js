import console from './logger.js';
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

//Filters staff by department and holiday status. If the employee has a preferred name, it adds that to the array as well.
const filterStaff = async () => {
  const rawBambooHR = await fetchStaff();
  const filteredBambooHR = {};

  for (let i = 0; i < rawBambooHR.length; i++) {
    const employee = rawBambooHR[i];
    if (employee.deparment == "Paid Media" && employee.holiday == true) {
      const employeeName = employee.firstName + " " + employee.lastName;
      filteredBambooHR[employeeName] = [];
      if (employee.preferredName != null && employee.preferredName != employee.firstName) {
      const employeeNickname = employee.preferredName + " " + employee.lastName;
      filteredBambooHR[employeeNickname] = [];
      }
    }
  }

  // return {
  //   'Tom Haynes': [],
  //   "Joe O'Donnell": [],
  //   'Sophie Grant' : [],
  // };
  //console.log(filteredBambooHR);
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

const getAnalysts = async (department) => {
  await authGoogle();
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: "1IeVtTwyFNxn4L8yObrjDHIxNSxhEPH_dPzUblv1e_84",
    range: "'Master AOL v2.0 (DRAFT)'!A1:Z",
    valueRenderOption: 'FORMATTED_VALUE'
  })
  
  const headers = res.data.values[1];
  let analyst;
  let secondaryAnalyst;
  
  if (department == "pm") {
    analyst = headers.indexOf("Analyst");
    secondaryAnalyst = headers.indexOf("Secondary analyst");
  } else if (department == "ps") {
    analyst = headers.indexOf("Paid Social lead");
    secondaryAnalyst = headers.indexOf("Paid Social secondary");
  }

  const returnValues = {};
  const values = res.data.values.slice(2)
  .filter((row) => new Boolean(row[0]) == true && new Boolean(row[analyst]) == true)
  .map((row) => {
    returnValues[row[0]] = [row[analyst], row[secondaryAnalyst]];
    return;
  });
  // console.log(returnValues);
  return returnValues;
}

// Builds the list of client who have no anaylst on duty
const buildSendList = async (department, midi) => {
  let sendList = ``;

  const onHoliday = await filterStaff();
  const clientAnalysts = await getAnalysts(department);

  for (const client in clientAnalysts) {
    const currAnalyst = clientAnalysts[client][0];
    if (currAnalyst in onHoliday) {
      onHoliday[currAnalyst].push([client, clientAnalysts[client][1]]);
    };
  }
  
  for (const analyst in onHoliday) {
    if (onHoliday[analyst].length == 0) {
      continue;
    };
    sendList += `<p>${analyst} is on holiday or sick today. The following clients are without an analyst:</p><ul>`;
    for (const client of onHoliday[analyst]) {
      if (new Boolean(client[1]) == false || client[1] in onHoliday) {
      sendList += `<li>${client[0]}</li>`;
      } else {
      sendList += `<li>${client[0]} - ${client[1]} is on duty as the secondary analyst</li>`;
      }
    }
    sendList += `</ul><br>`;
  }

  //console.log(sendList);

  if (sendList != ``) {
    sendEmail(sendList, department, midi);
  } else {
    console.log("No alert needed today");
  }
}

//Sends an email to HoPM if there are any clients without an analyst on duty
const sendEmail = (list, department, midi) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const depVar = department == "pm" ? "Paid Media" : "Paid Social";
  const msg = {
    to: 'paidmedia@bamboonine.co.uk',
    from: 'data@bamboonine.co.uk',
    subject: `${depVar} accounts without an analyst on duty this ${midi}`,
    //text: 'and easy to do anywhere, even with Node.js',
    html: `<p>Good ${midi}, Paid Media team!</p>
          <p>There are ${depVar} clients without an analyst on duty this ${midi}:</p>
          ${list}
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

const morningMail = schedule.scheduleJob({hour: 8, minute: 30}, () => {
  console.log("morning job scheduled");
  buildSendList("pm", "morning");
  buildSendList("ps", "morning");
});

const afternoonMail = schedule.scheduleJob({hour: 14, minute: 0}, () => {
  console.log("afternoon job scheduled");
  buildSendList("pm", "afternoon");
  buildSendList("ps", "afternoon");
});

// buildSendList("pm", "morning");
// buildSendList("ps", "afternoon");