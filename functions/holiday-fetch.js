import got from 'got';

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

  //return [ 'Zak Pashen'];
  return filteredBambooHR;
}

export {filterStaff};