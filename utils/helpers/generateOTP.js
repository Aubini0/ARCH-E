import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);


const sendOTP = (phone, code) => {
    client.messages
        .create({
            body: `This is your one-time password, it will expire in 15minutes ${code}`,
            from: '+16089339074',
            to: phone
        })
        .then(message => (message.sid));
}

export {
    sendOTP,
}