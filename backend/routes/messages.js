const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');

// POST /api/messages - Send a message to a specific recipient
router.post('/', verifyToken, async (req, res) => {
    const sender = req.user.username; // from token
    const { recipient, content } = req.body;

    if (!recipient || !content) {
        return res.status(400).json({ error: 'Recipient and content are required' });
    }

    try {
        await pool.query(
            'INSERT INTO messages (sender, recipient, content) VALUES ($1, $2, $3)',
            [sender, recipient, content]
        );
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        console.error('Error inserting message:', err.message);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// GET /api/messages/contacts — Get chat contacts with last message & time
router.get('/contacts/list', verifyToken, async (req, res) => {
    const currentUser = req.user.username;

    try {
        const result = await pool.query(
            `
            SELECT
                id,
                CASE
                    WHEN sender = $1 THEN recipient
                    ELSE sender
                END AS username,
                content AS last_message,
                created_at AS last_time
            FROM messages
            WHERE sender = $1 OR recipient = $1
            ORDER BY created_at DESC
            `,
            [currentUser]
        );

        // Group by unique username and get the latest message per user
        const seen = new Set();
        const conversations = [];

        for (const row of result.rows) {
            if (!seen.has(row.username)) {
                conversations.push(row);
                seen.add(row.username);
            }
        }

        res.json(conversations);
    } catch (err) {
        console.error('Error fetching contacts:', err.message);
        res.status(500).json({ error: 'Failed to fetch chat contacts' });
    }
});

// GET /api/messages/:user1/:user2 - Fetch all messages between two users
router.get('/:user1/:user2', verifyToken, async (req, res) => {
    const { user1, user2 } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM messages 
             WHERE (sender = $1 AND recipient = $2) 
                OR (sender = $2 AND recipient = $1)
             ORDER BY created_at ASC`,
            [user1, user2]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching messages:', err.message);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// DELETE /api/messages/:id — only sender can delete
router.delete('/:id', verifyToken, async (req, res) => {
    const messageId = req.params.id;
    const username = req.user.username;

    try {
        // Check if the message exists and belongs to the logged-in user
        const result = await pool.query(
            'SELECT * FROM messages WHERE id = $1 AND sender = $2',
            [messageId, username]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        // Delete the message
        await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);

        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        console.error('Error deleting message:', err.message);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});



module.exports = router;
