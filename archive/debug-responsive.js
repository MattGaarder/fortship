const {
    createMicrosoftDraft,
    sendMicrosoftDraft
} = require("../graph");

const testHtml = `<!DOCTYPE html>
<html>
<head>
    <style>
        .mobile {
            display: none;
        }

        @media screen and (max-width: 600px) {
            .desktop {
                display: none !important;
            }

            .mobile {
                display: block !important;
            }
        }
    </style>
</head>

<body>

    <div class="desktop">
        DESKTOP VERSION
    </div>

    <div class="mobile">
        MOBILE VERSION
    </div>

</body>
</html>`;

async function main() {
    try {
        // ---------------------------------------------------------
        // Get your existing Microsoft Graph access token here
        // ---------------------------------------------------------

        const accessToken = await getAccessToken();

        // ---------------------------------------------------------
        // Create the draft using the EXACT same Graph function
        // ---------------------------------------------------------

        const draft = await createMicrosoftDraft({
            to: ["matteus.gaarder@outlook.com"],
            subject: "Responsive Email Test",
            html: testHtml,
            accessToken,
            images: []
        });

        console.log("Draft created:", draft.id);

        // ---------------------------------------------------------
        // Send it using the EXACT same send function
        // ---------------------------------------------------------

        await sendMicrosoftDraft(
            draft.id,
            accessToken
        );

        console.log("Email sent successfully.");

    } catch (error) {
        console.error("DEBUG TEST FAILED:");
        console.error(error);
    }
}

main();