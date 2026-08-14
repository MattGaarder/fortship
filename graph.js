const fs = require("fs");
const path = require("path");

// DEBUG html from graph

async function getMicrosoftDraftBody(draftId, accessToken) {
    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${draftId}?$select=body`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Microsoft Graph returned ${response.status}: ${errorText}`
        );
    }

    const data = await response.json();

    const debugPath = path.join(__dirname, "debug-graph-email.html");

    await fs.promises.writeFile(
        debugPath,
        data.body.content,
        "utf8"
    );

    console.log(
        "DEBUG: Graph HTML written to:",
        debugPath
    );

    const mimeResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${draftId}/$value`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!mimeResponse.ok) {
        const errorText = await mimeResponse.text();

        throw new Error(
            `Microsoft Graph MIME request returned ${mimeResponse.status}: ${errorText}`
        );
    }

    // Graph returns the MIME message as raw text
    const mime = await mimeResponse.text();


    // ---------------------------------------------------------
    // 3. Save the raw MIME as .eml
    // ---------------------------------------------------------

    const debugMimePath = path.join(
        __dirname,
        "debug-graph-email-mime.eml"
    );

    await fs.promises.writeFile(
        debugMimePath,
        mime,
        "utf8"
    );

    console.log(
        "DEBUG: Graph MIME written to:",
        debugMimePath
    );

    console.log(
        "DEBUG: MIME length:",
        mime.length
    );


    // ---------------------------------------------------------
    // 4. Basic MIME diagnostics
    // ---------------------------------------------------------

    console.log(
        "DEBUG: MIME contains multipart/related:",
        mime.toLowerCase().includes("multipart/related")
    );

    console.log(
        "DEBUG: MIME contains text/html:",
        mime.toLowerCase().includes("text/html")
    );

    console.log(
        "DEBUG: MIME contains Content-ID:",
        mime.toLowerCase().includes("content-id:")
    );

    console.log(
        "DEBUG: MIME contains Content-Transfer-Encoding:",
        mime.toLowerCase().includes("content-transfer-encoding:")
    );

    console.log(
        "DEBUG: MIME contains @media:",
        mime.includes("@media")
    );


    return {
        html: data.body.content,
        mime
    }
}

//

async function createMicrosoftDraft({ to, subject, html, accessToken, images = [] }) {

    // DEBUG: save the exact HTML being sent to Microsoft Graph
    const debugPath = path.join(__dirname, "debug-email.html");

    fs.writeFileSync(debugPath, html, "utf8");

    console.log("DEBUG: HTML written to:", debugPath);
    console.log("DEBUG: HTML length:", html.length);
    console.log("DEBUG: Contains @media:", html.includes("@media"));
    console.log(
        "DEBUG: Contains desktop rule:",
        html.includes(".desktop-report")
    );
    console.log(
        "DEBUG: Contains mobile rule:",
        html.includes(".mobile-report")
    );



    const attachments = await Promise.all(images.map(async (img) => {
        const contentBytes = await fs.promises.readFile(img.path, "base64");
        const name = path.basename(img.path);
        let ext = path.extname(name).slice(1).toLowerCase();
        const contentType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
        return {
            "@odata.type": "#microsoft.graph.fileAttachment",
            name,
            contentType,
            contentBytes,
            isInline: true,
            contentId: img.cid
        };
    }));

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
                })),

                attachments
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

    const data = await response.json();
    console.log("DEBUG: Created draft ID:", data.id);
    await getMicrosoftDraftBody(data.id, accessToken);
    return data;
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
    sendMicrosoftDraft,
    getMicrosoftDraftBody
};
