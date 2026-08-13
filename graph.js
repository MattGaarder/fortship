async function createMicrosoftDraft({ to, subject, html, accessToken }) {
    const response = await fetch(
        "https://graph.microsoft.com/v1.0/me/messages",
        {
            method: "POST",

            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                subject,

                body: {
                    contentType: "HTML",
                    content: html
                },

                toRecipients: to.map((address) => ({
                    emailAddress: { address }
                }))
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        const requestId = response.headers.get("request-id");
        const authenticate = response.headers.get("www-authenticate");

        throw new Error(
            `Microsoft Graph returned ${response.status}: ${error || "no response body"}` +
            `${authenticate ? ` | WWW-Authenticate: ${authenticate}` : ""}` +
            `${requestId ? ` | request-id: ${requestId}` : ""}`
        );
    }

    return response.json();
}

async function sendMicrosoftDraft(draftId, accessToken) {
    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${draftId}/send`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        const requestId = response.headers.get("request-id");
        const authenticate = response.headers.get("www-authenticate");

        throw new Error(
            `Microsoft Graph returned ${response.status}: ${errorText || "no response body"}` +
            `${authenticate ? ` | WWW-Authenticate: ${authenticate}` : ""}` +
            `${requestId ? ` | request-id: ${requestId}` : ""}`
        );
    }

    return true;
}


module.exports = {
    createMicrosoftDraft,
    sendMicrosoftDraft
};
