const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail(to, subject, html) {
  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html,
    });

    console.log("Correo enviado:", data);
    return data;

  } catch (error) {
    console.error("Error enviando correo:", error);
    throw error;
  }
}

module.exports = { sendMail };