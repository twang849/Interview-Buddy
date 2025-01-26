import React, { useState } from 'react';
import './DefaultPage.css'; // Ensure the path is correct

function DefaultPage() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleButtonClick = () => {
    document.getElementById('fileInput').click();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    if (!file) {
      setError("Please select a file before uploading.");
      return;
    }
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:4000/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text(); // Capture error message from the backend
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Error during upload:", error);
      setError("Failed to upload file. Please try again or check the server.");
    }
  };

  const renderResponse = () => {
    if (!response) return null;

    // Split the transcript into segments based on "Speaker"
    const segments = response.feedback.transcription.split(/(?=Speaker)/g);

    return (
      <div>
        <h2>Analysis Result:</h2>
        <h3>Tips:</h3>
        <ul style={{textAlign: 'justify', lineHeight: '1.5'}}>
          {response.feedback.tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
        <h3>Transcription:</h3>
        <div className="transcript-box">
          {segments.map((segment, index) => (
            <p key={index}>{segment.trim()}</p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="DefaultPage">
      <h1>Interview Helper</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          id="fileInput"
          className="file-input"
          onChange={handleFileChange}
        />
        <button type="button" className="custom-button" onClick={handleButtonClick}>
          {file ? file.name : "Browse"}
        </button>
        <input id="submit-button" type="submit" value="Upload" />
      </form>

      <div className="feedback-container">
        <label className="feedback-label">Feedback</label>
        {error && <p className="error">{error}</p>}
        {response ? (
          <div className="feedback-text">
            {renderResponse()}
          </div>
        ) : (
          <textarea
            id="feedback"
            className="feedback-box"
            readOnly
            value="No feedback available."
          />
        )}
      </div>
    </div>
  );
}

export default DefaultPage;