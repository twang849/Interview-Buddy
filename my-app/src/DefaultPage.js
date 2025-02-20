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
  const uploadFile = async (event) => {
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
  const generateQuestions = async (event) => {
    event.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:4000/generate-questions", {
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

  const renderFeedback = () => {
    if (!response) return null;

    return (
      <div>
        {response && response.feedback.tips.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </div>
    );
  }
  
  const renderTranscript = () => {
    if (!response) return null;
    const segments = response.feedback.transcription.split(/(?=Speaker)/)

    return (
      <div>
        {response && segments.map((segment, index) => (
          <p key={index}>{segment.trim()}</p>
        ))}
      </div>
    );
  }

  const renderQuestions = () => {
    if (!questions) return null;

    return (
        <ul id="question-list">
          {questions.questions.map((tip, index) => (
            <li key={index} className='list-item'>{tip}</li>
          ))}
        </ul>
    );
  };

  return (
    <div>
      <title>InterviewBuddy</title>

      <div id="title-box">
        <h1 id="title"> InterviewBuddy</h1>
        <h3>Interview Buddy is a web-based platform that helps users improve their 
            interview skills through unlimited, personalized practice.</h3>
      </div>
      
    <div className='DefaultPage'>
      {error && <p className="error">{error}</p>}
      <div id="flex-helper">
        <div id="questions-and-desc">

          {/* Job Description Submission */}
          <form id="job-desc-container" onSubmit={generateQuestions}>
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
              <div className="questions-box" style={{color:'black'}}>
                {renderQuestions()}
              </div>
            ) : (<div className='centered-container'>
                    <div className='questions-box'>
                      No questions available. Submit a  job posting to receive practice questions.
                    </div>
                  </div>
            )}
          </div>
        </div>
      </div>

      {/* Browse Files and Upload Button */}
      <form onSubmit={uploadFile} >
        <input
          type="file"
          id="fileInput"
          className="file-input"
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

      {/* Feedback and Transcript */}
        <div className="feedback-text">
          <h1>Analysis Result</h1>

          {/* Feedback */}
          <div id='feedback-transcript-box'>
            <div>
              <h2>Feedback</h2>
              <ul id="tips" className='questions-box'>
                {renderFeedback()}
              </ul>
            </div>
            
            {/* Transcript */}
            <div>
              <h2>Transcript</h2>
              <div className="questions-box" style={{textAlign: 'justify', color: 'black'}}>
                {renderTranscript()}
             </div>
            </div>
          </div>
        </div>
        
      
      </div>
    </div>
  );
}

export default DefaultPage;