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

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Interview Helper Backend!');
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.'});
  }

  try {
    const audioFilePath = req.file.path;

    console.log(audioFilePath)

    // Spawn a Python process to handle the analysis
    const pythonProcess = spawn('python3', ['../analyze.py']);

    pythonProcess.stdin.write(`${audioFilePath}\n`);
    pythonProcess.stdin.end();

    let analysisResult = '';
    let errorResult = '';

    pythonProcess.stdout.on('data', (data) => {
      analysisResult += data.toString();
      console.log(data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      errorResult += data.toString();
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`Python process stderr: ${errorResult}`);
        return res.status(500).json({ error: 'Error occurred during analysis.', code: code, details: errorResult });
      }

      // Send the analysis result back to sthe client
      try {
        const parsedResult = JSON.parse(analysisResult); // Assuming analyze.py outputs JSON
        res.status(200).json(parsedResult);
      } catch (err) {
        console.error('Error parsing analysis result:', err);
        res.status(500).send('Failed to parse analysis result.');
      }
    });
  } catch (error) {
    console.log(error);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
