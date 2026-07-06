const express = require('express');
const cors = require('cors');
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

console.log('🚀 Starting server...');
console.log(`📡 PORT: ${PORT}`);

// ===== ENDPOINTS =====
app.get('/', (req, res) => {
    console.log('✅ Root called');
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
    
    res.json({
        status: 'success',
        message: 'OTP generated successfully',
        data: { phone, otp, otpSent: true }
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

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 https://mixxbyyas-offers06com-production.up.railway.app`);
    console.log('✅ Server is ready!');
});
