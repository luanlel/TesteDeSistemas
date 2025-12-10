import multer from "multer";

const storage = multer.memoryStorage(); // IMPORTANTE
export default multer({ storage });
