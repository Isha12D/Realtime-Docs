import Document from "../models/Document.js";

// Get all documents for the authenticated user
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [{ owner: req.userId }, { collaborators: req.userId }],
    })
      .populate("owner", "name email")
      .populate("collaborators", "name email")
      .sort({ lastModified: -1 });

    res.json({ documents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single document by ID
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if user has access
    const hasAccess =
      document.owner._id.toString() === req.userId ||
      document.collaborators.some((c) => c._id.toString() === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ document });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new document
export const createDocument = async (req, res) => {
  try {
    const { title } = req.body;

    const document = await Document.create({
      title,
      owner: req.userId,
      content: "",
    });

    const populatedDoc = await Document.findById(document._id).populate(
      "owner",
      "name email"
    );

    res.status(201).json({ document: populatedDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update document content
export const updateDocument = async (req, res) => {
  try {
    const { content } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if user has access
    const hasAccess =
      document.owner.toString() === req.userId ||
      document.collaborators.some((c) => c.toString() === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    document.content = content;
    document.lastModified = Date.now();
    await document.save();

    res.json({ document });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a document
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Only owner can delete
    if (document.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Only owner can delete" });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: "Document deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add collaborator to document
export const addCollaborator = async (req, res) => {
  try {
    const { userId } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Only owner can add collaborators
    if (document.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Only owner can add collaborators" });
    }

    if (!document.collaborators.includes(userId)) {
      document.collaborators.push(userId);
      await document.save();
    }

    const updatedDoc = await Document.findById(document._id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    res.json({ document: updatedDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
