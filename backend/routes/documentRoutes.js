import express from "express";
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  addCollaborator,
  getVersionHistory,
  revertToVersion,
} from "../controller/documentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.post("/", createDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);
router.post("/:id/collaborators", addCollaborator);

// Version history routes
router.get("/:id/versions", getVersionHistory);
router.post("/:id/revert", revertToVersion);

export default router;
