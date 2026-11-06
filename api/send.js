export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method tidak diizinkan"
    });
  }

  const { phone, problem } = req.body || {};

  if (
    typeof phone !== "string" ||
    !/^\+[0-9]{7,15}$/.test(phone) ||
    !["permanent", "temporary", "login"].includes(problem)
  ) {
    return res.status(400).json({
      error: "Data tidak valid"
    });
  }

  const issues = {
    permanent: {
      title: "Permanent WhatsApp Account Ban Appeal",
      name: "Permanently Blocked Account",
      request: "Please investigate the permanent restriction and restore access if it was applied incorrectly and the account is eligible under WhatsApp policies."
    },
    temporary: {
      title: "WhatsApp Temporary Account Restriction Review",
      name: "Temporarily Blocked Account",
      request: "Please investigate the temporary restriction and resolve it as soon as possible if the account is eligible under WhatsApp policies."
    },
    login: {
      title: "Urgent WhatsApp Login Unavailable Review",
      name: "Login Unavailable",
      request: "Please investigate the login problem, correct any technical errors, and restore access if the account is eligible under WhatsApp policies."
    }
  };

  const selected = issues[problem];

  const message = `Dear WhatsApp Support Team,

I am formally requesting an immediate review and resolution of the problem affecting my WhatsApp account.

ACCOUNT INFORMATION:
Phone Number: ${phone}
Issue: ${selected.name}

I am the owner of this phone number and currently cannot access my WhatsApp account.

I request your technical team to investigate this issue, identify its cause, and take the necessary action to resolve it.

${selected.request}

I am requesting an actual account review and resolution rather than general troubleshooting suggestions.

Please process this report and notify me of the outcome.

Thank you.

Sincerely,
WhatsApp Account Owner
${phone}`;

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!apiKey || !from) {
      throw new Error("Konfigurasi email belum lengkap");
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: from,
          to: ["support@support.whatsapp.com"],
          subject: selected.title + " - " + phone,
          text: message
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "Layanan email menolak pengiriman"
      });
    }

    return res.status(200).json({
      status: "accepted",
      id: result.id
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Kesalahan server"
    });
  }
}
