import React, { useState } from 'react';
import './DefaultPage.css'

function DefaultPage() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [textInput, setTextInput] = useState('');

  // Helper method for uploading file
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleButtonClick = () => {
    document.getElementById('fileInput').click();
  };

  // Function for handling file upload
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
        const errorText = await res.text(); 
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Error during upload:", error);
      setError("Failed to upload file. Please try again or check the server.");
    }
  };

  // Function for question generation from job description
  const handleTextSubmit = async (event) => {
    event.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:4000/analyze-text", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: textInput }),
      });

      if (!res.ok) {
        const errorText = await res.text(); 
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await res.json();
      setQuestions(data);

    } catch (error) {
      console.error("Error during text submission:", error);
      setError("Failed to submit text. Please try again or check the server.");
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
        <ul id="tips" >
          {response.feedback.tips.map((tip, index) => (
            <li key={index}>{tip} style={{}}</li>
          ))}
        </ul>
        <h3>Transcription:</h3>
        <div className="transcript-box" style={{textAlign: 'justify', lineHeight: 0}}>
          {segments.map((segment, index) => (
            <p key={index}>{segment.trim()}</p>
          ))}
        </div>
      </div>
    );
  };

  const questionResponse = () => {
    if (!questions) return null;

    return (
      <div className='question-container'>
        <ul style={{ textAlign: 'justify', lineHeight: '1.5' }}>
          {questions.questions.map((tip, index) => (
            <li key={index} className='list-item'>{tip}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className='DefaultPage'>
      <div id="title-box">
        <h1 id="title"> InterviewBuddy</h1>
        {error && <p className="error" style={{ color: 'red'}}>{error}</p>}
      </div>
      <div id="flex-helper">
        <div id="questions-and-desc">
          {/* Job Description Submission */}
          <form id="job-desc-container" onSubmit={handleTextSubmit}>
            <textarea
              id="job-desc-submit"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Copy and paste job description/posting below, then hit 'Submit Text'!"/> 
            <button id="submit-text-button" type="submit" className="custom-button">
              Submit Text
            </button>
          </form>

          {/* Questions */}
          <div>
            <label className="question-label">Practice Questions</label>
            {questions ? (
              <div className="question-text">
                {questionResponse()}
              </div>
            ) : (<div className='centered-container'>
                    <div id='questions-box'>
                      No questions available. Submit a  job posting to receive practice questions.
                    </div>
                  </div>
            )}
          </div>
        </div>
      </div>

      {/* Browse Files and Upload Button */}
      <form onSubmit={handleSubmit} >
        <input
          type="file"
          id="fileInput"
          className="file-input"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div id="instructions">
          After generating the practice questions, record your response with a <br/>
          device of choice and upload the .mp3 file below. Then, view your feedback!
        </div>

        <div id="browse-upload">
          {/* Browse */}
          <button type="button" id="browse-button" onClick={handleButtonClick}>
            {file ? file.name : "Browse"}
          </button>

          {/* Upload */}
          <input id="upload-button" type="submit" value="Upload"/>
        </div>
      </form>

      {/* Feedback Container */}
      <div className="feedback-container" style={{ marginTop: '20px' }}>
        <label className="feedback-title" style={{ fontWeight: 'bold' }}>Feedback</label>
        {response ? (
          <div className="feedback-text" style={{ marginTop: '10px' }}>
            {renderResponse()}
          </div>
        ) : (
          <textarea
            id="feedback"
            readOnly
            value="No feedback available."/>
        )}
      </div>
      
    </div>
  );
}

export default DefaultPage;