import Document from "../models/Document.js";
import DocumentVersion from "../models/DocumentVersion.js";

// Get all documents - show all documents to everyone
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({})
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

    // Allow anyone to view the document (public sharing)
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

    // Get the last version number
    const lastVersion = await DocumentVersion.findOne({ documentId: req.params.id })
      .sort({ versionNumber: -1 });
    
    const newVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // Save current version to history before updating
    await DocumentVersion.create({
      documentId: req.params.id,
      content: content,
      savedBy: req.userId,
      versionNumber: newVersionNumber,
    });

    // Allow anyone to edit the document (public collaboration)
    document.content = content;
    document.lastModified = Date.now();
    await document.save();

    res.json({ document, versionNumber: newVersionNumber });
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

// Get version history for a document
export const getVersionHistory = async (req, res) => {
  try {
    const versions = await DocumentVersion.find({ documentId: req.params.id })
      .populate("savedBy", "name email")
      .sort({ versionNumber: -1 })
      .limit(50); // Last 50 versions

    res.json({ versions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Revert document to a specific version
export const revertToVersion = async (req, res) => {
  try {
    const { versionNumber } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Find the version to revert to
    const version = await DocumentVersion.findOne({
      documentId: req.params.id,
      versionNumber: versionNumber,
    });

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    // Revert document content
    document.content = version.content;
    document.lastModified = Date.now();
    await document.save();

    res.json({ document, message: `Reverted to version ${versionNumber}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
