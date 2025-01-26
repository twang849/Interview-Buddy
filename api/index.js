const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Environment Variables
const PORT = process.env.PORT || 4000;

// File Upload Directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created 'uploads' folder at: ${uploadDir}`);
}

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save with timestamp + original extension
  },
});
const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Interview Helper Backend!');
});

// File Upload and Python Processing Route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const audioFilePath = req.file.path;

    console.log(`File uploaded: ${audioFilePath}`);

    // Spawn Python process to analyze the file
    const pythonProcess = spawn('python3', ['../analyze.py']);

    // Send the audio file path to the Python script via stdin
    pythonProcess.stdin.write(`${audioFilePath}\n`);
    pythonProcess.stdin.end();

    let analysisResult = '';
    let errorResult = '';

    // Capture data from Python script's stdout
    pythonProcess.stdout.on('data', (data) => {
      analysisResult += data.toString();
      console.log(`Python stdout: ${data.toString()}`);
    });

    // Capture errors from Python script's stderr
    pythonProcess.stderr.on('data', (data) => {
      errorResult += data.toString();
      console.error(`Python stderr: ${data.toString()}`);
    });

    // Handle when Python process exits
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`Error details: ${errorResult}`);
        return res.status(500).json({
          error: 'Error occurred during analysis.',
          code: code,
          details: errorResult,
        });
      }

      // Attempt to parse the result from Python's output
      try {
        const parsedResult = JSON.parse(analysisResult); // Expecting JSON output from Python
        res.status(200).json(parsedResult);
      } catch (err) {
        console.error('Error parsing analysis result:', err);
        res.status(500).send('Failed to parse analysis result.');
      }
    });
  } catch (error) {
    console.error('Unexpected server error:', error);
    res.status(500).json({ error: 'Server error occurred.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
