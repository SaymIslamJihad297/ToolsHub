import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const inputData = JSON.stringify(req.body);
    
    // Execute Python script
    const pythonProcess = spawn('python3', [
      path.join(process.cwd(), 'enhance_image.py'),
      inputData
    ]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({
          success: false,
          error: `Python process exited with code ${code}`,
          stderr: error
        });
      }

      try {
        const result = JSON.parse(output);
        res.status(200).json(result);
      } catch (parseError) {
        res.status(500).json({
          success: false,
          error: 'Failed to parse Python output',
          output: output
        });
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}