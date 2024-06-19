import sgMail from '@sendgrid/mail';

//Sends an email to HoPM if there are any clients without an analyst on duty
const sendEmail = (list, media) => {
    let mediaName;

    if (media == "pm") {
      mediaName = "Paid Media";
    } else if (media == "ps") {
      mediaName = "Paid Social";
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: ['paidmedia@bamboonine.co.uk', 'data@bamboonine.co.uk'],
      from: 'data@bamboonine.co.uk',
      subject: 'Accounts without an analyst on duty',
      //text: 'and easy to do anywhere, even with Node.js',
      html: `<p>Good Morning, Team!</p>
            <p>There are ${mediaName} clients without an analyst on duty today:</p>
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

  export { sendEmail };