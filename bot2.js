import WebSocket from "ws";
import dotnev from "dotenv";
dotnev.config({ path: "./tokens-bot.env" });
const OAUTH_TOKEN = process.env.OAUTH_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const BOT_USER_ID = process.env.BOT_USER_ID;

const CHAT_CHANNEL_USER_ID = "1181593187"; // User ID of the channel where the bot will operate

const EVENTSUB_WEBSOCKET_URL = "wss://eventsub.wss.twitch.tv/ws";
var websocketSessionID;

// Start executing the bot from here
(async () => {
    // Verify that the authentication is valid
    await getAuth();

    // Start WebSocket client and register handlers
    const websocketClient = startWebSocketClient();
})();

// WebSocket will persist the application loop until you exit the program forcefully

async function getAuth() {
    // https://dev.twitch.tv/docs/authentication/validate-tokens/#how-to-validate-a-token
    let response = await fetch("https://id.twitch.tv/oauth2/validate", {
        method: "GET",
        headers: {
            Authorization: "OAuth " + OAUTH_TOKEN,
        },
    });

    if (response.status != 200) {
        let data = await response.json();
        console.error(
            "Token is not valid. /oauth2/validate returned status code " +
                response.status,
        );
        console.error(data);
        process.exit(1);
    }
	let data = await response.json();
	console.log(data);
    console.log("Validated token.");
}

function startWebSocketClient() {
    let websocketClient = new WebSocket(EVENTSUB_WEBSOCKET_URL);

    websocketClient.on("error", console.error);

    websocketClient.on("open", () => {
        console.log("WebSocket connection opened to " + EVENTSUB_WEBSOCKET_URL);
    });

    websocketClient.on("message", (data) => {
        handleWebSocketMessage(JSON.parse(data.toString()));
    });

    return websocketClient;
}

function handleWebSocketMessage(data) {
    switch (data.metadata.message_type) {
        case "session_welcome": // First message you get from the WebSocket server when connecting
            websocketSessionID = data.payload.session.id; // Register the Session ID it gives us
            sendChatMessage("Mad is online! VoHiYo");
            console.log(
                "WebSocket session established. Session ID: " +
                    websocketSessionID,
            );
            // Listen to EventSub, which joins the chatroom from your bot's account
            registerEventSubListeners();
            break;
        case "notification": // An EventSub notification has occurred, such as channel.chat.message
            switch (data.metadata.subscription_type) {
                case "channel.chat.message":
                    switch (data.payload.event.message.text.trim()) {
                        case "!lurk":
                            sendChatMessage("VoHiYo");
                            break;
                        case "!github":
                            sendChatMessage(
                                "Check out my GitHub at: https://github.com/Demon-wire",
                            );
                            break;
                        case "!dc":
                            sendChatMessage(
                                "Check out my discord server at: https://discord.gg/WRxfsztjFm",
                            );
                            break;
                        case "!project":
                            sendChatMessage(
                                "Currently working on a Twitch Bot project using Node.js um NoirPI stolz zu machen!",
                            );
                            break;
                    }
                    break;
                case "channel.follow": {
                    const username = data.payload.event.user_name;
                    sendChatMessage(`Danke fürs Follow, ${username}! 💜`);
                    break;
                }
                case "channel.subscription.gift": {
                    const username = data.payload.event.user_name;
                    const tier = data.payload.event.tier; // 1000, 2000, 3000
                    let tierText = "Tier 1";
                    if (tier === "2000") tierText = "Tier 2";
                    if (tier === "3000") tierText = "Tier 3";
                    sendChatMessage(
                        `🎉 DANKE ${username} für das verschenkte ${tierText}-Sub an die Community! 💜`,
                    );
                    break;
                }

                case "channel.subscribe":
                    {
                        const username = data.payload.event.user_name;
                        const tier = data.payload.event.tier; // 1000, 2000, 3000
                        const isPrime = data.payload.event.is_prime;
                        let tierText = "Tier 1";
                        if (tier === "2000") tierText = "Tier 2";
                        if (tier === "3000") tierText = "Tier 3";
                        if (isPrime) tierText = "Prime";
                        sendChatMessage(
                            `🎉 DANKE ${username} für das ${tierText}-Sub! 💜`,
                        );
                        break;
                    }
                    break;
            }
            break;
    }
}

async function sendChatMessage(chatMessage) {
    let response = await fetch("https://api.twitch.tv/helix/chat/messages", {
        method: "POST",
        headers: {
            Authorization: "Bearer " + OAUTH_TOKEN,
            "Client-Id": CLIENT_ID,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            broadcaster_id: CHAT_CHANNEL_USER_ID,
            sender_id: BOT_USER_ID,
            message: chatMessage,
        }),
    });

    if (response.status != 200) {
        let data = await response.json();
        console.error("Failed to send chat message");
        console.error(data);
    } else {
        console.log("Sent chat message: " + chatMessage);
    }
}

async function registerEventSubListeners() {
    // Register channel.chat.message
    let response_chat_message = await fetch(
        "https://api.twitch.tv/helix/eventsub/subscriptions",
        {
            method: "POST",
            headers: {
                Authorization: "Bearer " + OAUTH_TOKEN,
                "Client-Id": CLIENT_ID,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "channel.chat.message",
                version: "1",
                condition: {
                    broadcaster_user_id: CHAT_CHANNEL_USER_ID,
                    user_id: BOT_USER_ID,
                },
                transport: {
                    method: "websocket",
                    session_id: websocketSessionID,
                },
            }),
        },
    );
    // channel.subscribe
    let response_subscribe = await fetch(
        "https://api.twitch.tv/helix/eventsub/subscriptions",
        {
            method: "POST",
            headers: {
                Authorization: "Bearer " + OAUTH_TOKEN,
                "Client-Id": CLIENT_ID,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "channel.subscribe",
                version: "1",
                condition: {
                    broadcaster_user_id: CHAT_CHANNEL_USER_ID,
                },
                transport: {
                    method: "websocket",
                    session_id: websocketSessionID,
                },
            }),
        },
    );

    let response_follow = await fetch(
        "https://api.twitch.tv/helix/eventsub/subscriptions",
        {
            method: "POST",
            headers: {
                Authorization: "Bearer " + OAUTH_TOKEN,
                "Client-Id": CLIENT_ID,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "channel.follow",
                version: "2",
                condition: {
                    broadcaster_user_id: CHAT_CHANNEL_USER_ID,
                    moderator_user_id: BOT_USER_ID,
                },
                transport: {
                    method: "websocket",
                    session_id: websocketSessionID,
                },
            }),
        },
    );
    let response_subscription_gift = await fetch(
        "https://api.twitch.tv/helix/eventsub/subscriptions",
        {
            method: "POST",
            headers: {
                Authorization: "Bearer " + OAUTH_TOKEN,
                "Client-Id": CLIENT_ID,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "channel.subscription.gift",
                version: "1",
                condition: {
                    broadcaster_user_id: CHAT_CHANNEL_USER_ID,
                },
                transport: {
                    method: "websocket",
                    session_id: websocketSessionID,
                },
            }),
        },
    );

    if (response_chat_message.status != 202) {
        let data = await response_chat_message.json();
        console.error(
            "Failed to subscribe to channel.chat.message. API call returned status code " +
                response_chat_message.status,
        );
        console.error(data);
        process.exit(1);
        console.error(data);
        process.exit(1);
    } else if (response_follow.status != 202) {
        let data = await response_follow.json();
        console.error(
            "Failed to subscribe to channel.follow. API call returned status code " +
                response_follow.status,
        );
        console.error(data);
        process.exit(1);
    } else if (response_subscription_gift.status != 202) {
        let data = await response_subscription_gift.json();
        console.error(
            "Failed to subscribe to channel.subscription.gift. API call returned status code " +
                response_subscription_gift.status,
        );
        console.error(data);
        process.exit(1);
    } else {
        let data1 = await response_chat_message.json();
        let data3 = await response_follow.json();
        let data4 = await response_subscription_gift.json();
        const data = { ...data1, ...data3, ...data4 };
        console.log(`Subscribed to channel.chat.message [${data.data[0].id}]`);
    }
}
