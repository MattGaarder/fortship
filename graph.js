const fs = require("fs");
const path = require("path");

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

    const debugPath = path.join(
        __dirname,
        "debug-graph-email.html"
    );

    await fs.promises.writeFile(
        debugPath,
        data.body.content,
        "utf8"
    );

    console.log(
        "DEBUG: Graph HTML written to:",
        debugPath
    );

    return data.body.content;
}


async function createMicrosoftDraft({
    to,
    subject,
    html,
    accessToken,
    images = [],
    attachments = []
}) {

    const imageAttachments = await Promise.all(
        images.map(async (img) => {

            const contentBytes =
                await fs.promises.readFile(
                    img.path,
                    "base64"
                );

            const name = path.basename(img.path);

            const ext =
                path.extname(name)
                    .slice(1)
                    .toLowerCase();

            const contentType =
                ext === "jpg"
                    ? "image/jpeg"
                    : `image/${ext}`;

            return {
                "@odata.type":
                    "#microsoft.graph.fileAttachment",

                name,
                contentType,
                contentBytes,
                isInline: true,
                contentId: img.cid
            };
        })
    );

    const fileAttachments = attachments.map((attachment) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: attachment.name,
        contentType: attachment.contentType,
        contentBytes: attachment.contentBytes.toString("base64"),
        isInline: false
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
                    emailAddress: {
                        address
                    }
                })),

                attachments: [
                    ...imageAttachments,
                    ...fileAttachments
                ]
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        const requestId =
            response.headers.get("request-id");
        const authenticate =
            response.headers.get("www-authenticate");

        throw new Error(
            `Microsoft Graph returned ${response.status}: ${error || "no response body"}` +
            `${authenticate ? ` | WWW-Authenticate: ${authenticate}` : ""}` +
            `${requestId ? ` | request-id: ${requestId}` : ""}`
        );
    }

    const data = await response.json();

    console.log(
        "DEBUG: Created draft ID:",
        data.id
    );

    // Optional debugging: confirm what Graph actually stored.
    await getMicrosoftDraftBody(
        data.id,
        accessToken
    );

    return data;
}


async function sendMicrosoftDraft(
    draftId,
    accessToken
) {

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
        const requestId =
            response.headers.get("request-id");
        const authenticate =
            response.headers.get("www-authenticate");

        throw new Error(
            `Microsoft Graph returned ${response.status}: ${errorText || "no response body"}` +
            `${authenticate ? ` | WWW-Authenticate: ${authenticate}` : ""}` +
            `${requestId ? ` | request-id: ${requestId}` : ""}`
        );
    }

    return true;
}

async function testOneDriveFile(accessToken) {
    const response = await fetch(
        "https://graph.microsoft.com/v1.0/me/drive/root/children",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            `OneDrive Graph request failed (${response.status}): ${error}`
        );
    }

    const data = await response.json();

    console.log("========== ONEDRIVE DEBUG ==========");
    console.log(
        data.value.map(file => ({
            name: file.name,
            id: file.id,
            size: file.size,
            file: !!file.file,
            folder: !!file.folder
        }))
    );

    return data.value;
}


async function downloadOneDriveFileById(accessToken, itemId) {
    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(itemId)}/content`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {
        const body = await response.text();

        throw new Error(
            `OneDrive workbook download failed (${response.status}): ${body}`
        );
    }

    const arrayBuffer = await response.arrayBuffer();

    return Buffer.from(arrayBuffer);
}


module.exports = {
    createMicrosoftDraft,
    sendMicrosoftDraft,
    getMicrosoftDraftBody,
    testOneDriveFile,
    downloadOneDriveFileById
};