import WebSocket from 'ws';
import dotnev from 'dotenv';
dotnev.config({path:'./tokens-bot.env'});
const OAUTH_TOKEN = process.env.OAUTH_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const BOT_USER_ID = process.env.BOT_USER_ID;

const CHAT_CHANNEL_USER_ID = '1181593187'; // User ID of the channel where the bot will operate

const EVENTSUB_WEBSOCKET_URL = 'ws://localhost:8080/ws';
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
    let response = await fetch('https://id.twitch.tv/oauth2/validate', {
        method: 'GET',
        headers: {
            'Authorization': 'OAuth ' + process.env.OAUTH_TOKEN
        }
    });

    if (response.status != 200) {
        let data = await response.json();
        console.error("Token is not valid. /oauth2/validate returned status code " + response.status);
        console.error(data);
        process.exit(1);
    }

    console.log("Validated token.");
}

function startWebSocketClient() {
    let websocketClient = new WebSocket(EVENTSUB_WEBSOCKET_URL);

    websocketClient.on('error', console.error);

    websocketClient.on('open', () => {
        console.log('WebSocket connection opened to ' + EVENTSUB_WEBSOCKET_URL);
    });

    websocketClient.on('message', (data) => {
        handleWebSocketMessage(JSON.parse(data.toString()));
    });

    return websocketClient;
}

function handleWebSocketMessage(data) {
    switch (data.metadata.message_type) {
        case 'session_welcome': // First message you get from the WebSocket server when connecting
            websocketSessionID = data.payload.session.id; // Register the Session ID it gives us
            //sendChatMessage("Mad is online! VoHiYo");
            console.log("WebSocket session established. Session ID: " + websocketSessionID);
            // Listen to EventSub, which joins the chatroom from your bot's account
            registerEventSubListeners();
            break;
        case 'notification': // An EventSub notification has occurred, such as channel.chat.message
        console.log("Notification received:");  
        console.log(data.metadata.subscription_type);
            switch (data.metadata.subscription_type) {
                case 'channel.chat.message':      

                    switch(data.payload.event.message.text.trim()) {
                    case "!lurk":
                       // sendChatMessage("VoHiYo");
                        break;
                    case "!github":
                        //sendChatMessage("Check out my GitHub at: https://github.com/Demon-wire");
                        break;
                    case "!dc":
                        //sendChatMessage("Check out my discord server at: https://discord.gg/WRxfsztjFm");
                       break;
                    case "!project":
                        //sendChatMessage("Currently working on a Twitch Bot project using Node.js um NoirPI stolz zu machen!");
                        break;
                    } 
                    break;    
                    case 'channel.follow': {
                        const username = data.payload.event.user_name;
                        console.log(`Danke fürs Follow, ${username}! 💜`);
                        //sendChatMessage(`Danke fürs Follow, ${username}! 💜`);
                        break;
                        }
                    case 'channel.subscription.gift': {
                        const username = data.payload.event.user_name;
                        const tier = data.payload.event.tier; // 1000, 2000, 3000
                        let tierText = "Tier 1";
                        if (tier === "2000") tierText = "Tier 2";
                        if (tier === "3000") tierText = "Tier 3";
                        console.log(`🎉 DANKE ${username} für das verschenkte ${tierText}-Sub an die Community! 💜`);
                        break;
                    }
                    
                    
                    case 'channel.subscribe': {
                        const username = data.payload.event.user_name;
                        const tier = data.payload.event.tier; // 1000, 2000, 3000
                        const isPrime = data.payload.event.is_prime;
                        let tierText = "Tier 1";
                        if (tier === "2000") tierText = "Tier 2";
                        if (tier === "3000") tierText = "Tier 3";
                        if (isPrime) tierText = "Prime";

                        if (!gifted){ console.log(
                            `🎉 DANKE ${username} für das ${tierText}-Sub! 💜`
                            );}
                        break;
                        }      
                break;
            }
            break;
    }
}


async function registerEventSubListeners() {
    let response = await fetch('http://localhost:8080/eventsub/subscriptions', {
        method: 'POST',
        headers: {
            'Client-Id': CLIENT_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 'channel.follow',
            version: '2',
            condition: {
                broadcaster_user_id: CHAT_CHANNEL_USER_ID,
                user_id: BOT_USER_ID
            },
            transport: {
                method: 'websocket',
                session_id: websocketSessionID
            }
        })
    });
    let response2 = await fetch('http://localhost:8080/eventsub/subscriptions', {
        method: 'POST',
        headers: {
            'Client-Id': CLIENT_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 'channel.subscribtion.gift',
            version: '1',
            condition: {
                broadcaster_user_id: CHAT_CHANNEL_USER_ID,
                user_id: BOT_USER_ID
            },
            transport: {
                method: 'websocket',
                session_id: websocketSessionID
            }
        })
    });


    if (response.status != 202) {
        let data = await response.json();
        console.error("API call returned status code " + response.status);
        console.error(data);
    //  process.exit(1);
    } else {
        let data1 = await response.json();
        let data2 = await response2.json();
        const data = {...data1, ...data2};
        console.log(`Subscribed to channel.chat.message [${data.data[0].id}]`);
    }
}