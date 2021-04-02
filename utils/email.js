const nodemailer = require('nodemailer');

const sendEmail = async options =>{
    //1 Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_HOST,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
        // Activate less secure app in gmail
    })
    //2 define email options
    const mailOptions = {
        from: 'Jonas Schmedtann <hello@jonas.io>',
        to: options.email,
        subject: options.subject,
        text: options.message,
  //      html: 

    }

    //3 actually send email
    await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;