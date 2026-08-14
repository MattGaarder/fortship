const {
    getGmailClient
} = require("./gmail-auth");


const MailComposer = require("nodemailer/lib/mail-composer");

async function createMimeMessage({ to, subject, html, images = [] }) {
    const mail = new MailComposer({
        to,
        subject,
        html,
        attachments: images.map(img => ({
            path: img.path,
            cid: img.cid
        }))
    });
    
    const message = await mail.compile().build();

    // debug

    require("fs").writeFileSync(
        "./debug-email.eml",
        message
    );

    return message.toString("base64url");
}

async function createGmailDraft({
    tokens,
    to,
    subject,
    html,
    images
}) {
    const gmail = getGmailClient(tokens);
    const raw = await createMimeMessage({
        to,
        subject,
        html,
        images
    });
    const response =
        await gmail.users.drafts.create({
            userId: "me",
            requestBody: {
                message: {
                    raw
                }
            }
        });
    return response.data;
}

async function sendGmailDraft({
    tokens,
    draftId
}) {
    const gmail = getGmailClient(tokens);
    const response =
        await gmail.users.drafts.send({
            userId: "me",

            requestBody: {
                id: draftId
            }
        });
    return response.data;
}

module.exports = {
    createGmailDraft,
    sendGmailDraft
};