import express from 'express';
import Document from '../models/Document.js';
import  authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all documents of the user
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [{ owner: req.user.id }, { collaborators: req.user.id }],
    }).sort({ updatedAt: -1 });
    res.json({ documents });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// POST create a new document
router.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    const doc = await Document.create({ title, owner: req.user.id });
    res.status(201).json({ document: doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create document' });
  }
});

// GET a single document
router.get('/:docId', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.owner.toString() !== req.user.id && !doc.collaborators.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch document' });
  }
});

// PUT update document content
router.put('/:docId', async (req, res) => {
  const { content } = req.body;
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.owner.toString() !== req.user.id && !doc.collaborators.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    doc.content = content;
    await doc.save();

    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update document' });
  }
});

// DELETE a document
router.delete('/:docId', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can delete document' });
    }

    await doc.remove();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

export default router;
