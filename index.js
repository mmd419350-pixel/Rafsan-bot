const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const pino = require("pino")
const config = require("./config")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state
    })

    sock.ev.on("connection.update", async (update) => {
        const { connection, qr } = update

        if (qr) {
            console.log("📷 QR Code:", qr)
        }

        if (connection === "open") {
            console.log("✅ Bot Connected:", config.botName)
        }

        if (connection === "close") {
            console.log("❌ Reconnecting...")
            startBot()
        }
    })

    sock.ev.on("creds.update", saveCreds)

    if (!sock.authState.creds.registered) {
        const code = await sock.requestPairingCode(config.ownerNumber)
        console.log("🔑 Pair Code:", code)
    }

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text

        if (text === "hi") {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "Hello Rafsan 🔥"
            })
        }
    })
}

startBot()
