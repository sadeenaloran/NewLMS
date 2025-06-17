import { Router } from "express";
import {
  deleteFile,
  getFileById,
  uploadFile,
} from "../controllers/attachmentController.js";

const router = Router();

router.post("/upload", uploadFile);
router.get("/file/:id", getFileById);
router.delete("/file/:id", deleteFile);

export default router;
