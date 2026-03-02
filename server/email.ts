export async function sendOtpEmail(email: string, otp: string) {
  const apiKey = process.env.BREVO_API_KEY;
  // Use SENDER_EMAIL if provided, else fall back to SMTP_USER
  const senderEmail = process.env.SMTP_USER;

  // If no API key, log to console (Dev mode fallback)
  if (!apiKey) {
    console.log("\n========================================");
    console.log(`[DEV] OTP not sent (No API Key)
         for ${email}: ${otp}`);
    console.log("========================================\n");
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "HackSync",
          email: senderEmail
        },
        to: [
          {
            email: email,
          }
        ],
        subject: "Verify your email for HackSync",
        htmlContent: `<b>Your verification code is: ${otp}</b><p>It expires in 10 minutes.</p>`,
        textContent: `Your verification code is: ${otp}. It expires in 10 minutes.`
      })
    });

    const data = (await response.json()) as any;

    if (response.ok) {
      console.log(`[email] OTP sent to ${email}. MessageID: ${data.messageId}`);
    } else {
      console.error("[email] Error sending OTP email via Brevo API:");
      console.error(JSON.stringify(data, null, 2));
      console.log(`[DEV ONLY] Fallback OTP for ${email}: ${otp}`);
    }
  } catch (err) {
    console.error("[email] Fetch error sending OTP email:");
    console.error(err);
    console.log(`[DEV ONLY] Fallback OTP for ${email}: ${otp}`);
  }
}
