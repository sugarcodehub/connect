const express = require('express');
const jwt = require('jsonwebtoken');
const { AccessToken } = require('livekit-server-sdk');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create or join a room and get LiveKit token
router.post('/join', authenticateToken, async (req, res) => {
  const { roomName, calleeUsername } = req.body;
  const username = req.user.username;

  if (!roomName) {
    return res.status(400).json({ error: 'Room name is required' });
  }

  try {
    // Create LiveKit access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: username,
      ttl: '2h',
    });

    // Grant permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    console.log('Generated token for user:', username, 'room:', roomName);
    console.log('Token type:', typeof token);

    // Log the call session
    if (calleeUsername) {
      const calleeResult = await req.db.query(
        'SELECT id FROM users WHERE username = $1',
        [calleeUsername]
      );

      if (calleeResult.rows.length > 0) {
        await req.db.query(
          `INSERT INTO call_sessions (room_name, caller_id, callee_id, recording_enabled) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (room_name) DO NOTHING`,
          [roomName, req.user.userId, calleeResult.rows[0].id, false]
        );
      }
    }

    // Determine the correct LiveKit URL for the client
    // In development: ws://localhost:7880
    // In production with domain: wss://yourdomain.com
    const clientUrl = process.env.LIVEKIT_CLIENT_URL || 'ws://localhost:7880';

    res.json({
      token: token,
      url: clientUrl
    });
  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ error: 'Failed to join room', details: err.message });
  }
});

// Start recording
router.post('/start-recording', authenticateToken, async (req, res) => {
  const { roomName } = req.body;

  try {
    await req.db.query(
      'UPDATE call_sessions SET recording_enabled = TRUE WHERE room_name = $1',
      [roomName]
    );

    res.json({ message: 'Recording started' });
  } catch (err) {
    console.error('Start recording error:', err);
    res.status(500).json({ error: 'Failed to start recording' });
  }
});

// End call
router.post('/end-call', authenticateToken, async (req, res) => {
  const { roomName } = req.body;

  try {
    await req.db.query(
      'UPDATE call_sessions SET ended_at = CURRENT_TIMESTAMP, status = $1 WHERE room_name = $2',
      ['ended', roomName]
    );

    res.json({ message: 'Call ended' });
  } catch (err) {
    console.error('End call error:', err);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

// Get online users (simplified - in production use Redis/WebSocket)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const result = await req.db.query(
      'SELECT id, username FROM users WHERE id != $1 ORDER BY username',
      [req.user.userId]
    );

    res.json({ users: result.rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;