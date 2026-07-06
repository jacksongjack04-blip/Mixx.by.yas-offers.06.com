// backend/server.js
const express = require('express');
const cors = require('cors');
const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== PORT =====
const PORT = process.env.PORT || 5000;

// ===== LOGGING =====
console.log('🚀 Starting server...');
console.log(`📡 PORT: ${PORT}`);

// ===== TEST ENDPOINTS =====
app.get('/', (req, res) => {
    console.log('✅ Root endpoint called');
    res.json({
        status: 'online',
        message: 'Mixx by Yas API is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    console.log('✅ Health check called');
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.post('/api/login', (req, res) => {
    console.log('📥 Login request received:', req.body);
    const { phone, pin } = req.body;
    
    if (!phone || !pin) {
        console.log('❌ Missing phone or pin');
        return res.status(400).json({
            status: 'error',
            message: 'Phone and PIN are required'
        });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 OTP for ${phone}: ${otp}`);
    
    res.json({
        status: 'success',
        message: 'OTP generated successfully',
        data: { phone, otp }
    });
});

app.post('/api/verify-otp', (req, res) => {
    console.log('📥 Verify OTP:', req.body);
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
        return res.status(400).json({
            status: 'error',
            message: 'Phone and OTP are required'
        });
    }
    
    if (otp.length === 6) {
        res.json({
            status: 'success',
            message: 'OTP verified successfully!',
            data: { phone, verified: true }
        });
    } else {
        res.status(400).json({
            status: 'error',
            message: 'Invalid OTP. Must be 6 digits'
        });
    }
});

app.post('/api/resend-otp', (req, res) => {
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
    
    res.json({
        status: 'success',
        message: 'New OTP sent successfully!',
        data: { phone, otp }
    });
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
    console.log(`📍 URL: https://mixxbyyas-offers06com-production.up.railway.app`);
    console.log('✅ Server is ready!');
});

// Log when server crashes
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled rejection:', err);
});
