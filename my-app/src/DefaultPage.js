import React, { useState } from 'react';
import './DefaultPage.css'

function DefaultPage() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [textInput, setTextInput] = useState(''); // Define the textInput state variable

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
        const errorText = await res.text(); // Capture error message from the backend
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
        <ul style={{ textAlign: 'justify', lineHeight: '1.5' }}>
          {response.feedback.tips.map((tip, index) => (
            <li key={index}>{tip}</li>
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
      <div>
        {/* <h3>Tips:</h3> */}
        <ul style={{ textAlign: 'justify', lineHeight: '1.5' }}>
          {questions.questions.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
        {/* <h3>Transcription:</h3> */}
        {/* <div className="transcript-box" style={{textAlign: 'justify', lineHeight: 0}}>
          {segments.map((segment, index) => (
            <p key={index}>{segment.trim()}</p>
          ))}
        </div> */}
      </div>
    );
  };

  return (
    <div className="DefaultPage">
      <h1 style={{ color: '#333', fontSize: '70px' }}>InterviewBuddy</h1>

      <form onSubmit={handleTextSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Copy and paste job description/posting below, then hit 'Submit Text'!"
          style={{ width: '300px', height: '150px', padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px', marginTop: '10px' }}
        />
        <button type="submit" className="custom-button" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '15px', marginTop: '10px' }}>
          Submit Text
        </button>
      </form>

      <div className="question-container" style={{ marginTop: '20px' }}>
        <label className="question-label" style={{ fontWeight: 'bold' }}>Practice Questions</label>
        {error && <p className="error" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        {questions ? (
          <div className="question-text" style={{ marginLeft: '100px', marginTop: '10px' }}>
            {questionResponse()}
          </div>
        ) : (
          <textarea
            id="question"
            readOnly
            value="No questions available."
            style={{ resize: 'none', width: '100%', height: '100px' }}
          />
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <input
          type="file"
          id="fileInput"
          className="file-input"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button type="button" className="custom-button" onClick={handleButtonClick} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '15px', marginTop: '10px' }}>
          {file ? file.name : "Browse"}
        </button>
        <input id="submit-button" type="submit" value="Upload" style={{ borderRadius: '10px', padding: '5px', marginTop: '10px' }} />
      </form>

      <div className="feedback-container" style={{ marginTop: '20px' }}>
        <label className="feedback-label" style={{ fontWeight: 'bold' }}>Feedback</label>
        {error && <p className="error" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        {response ? (
          <div className="feedback-text" style={{ marginTop: '10px' }}>
            {renderResponse()}
          </div>
        ) : (
          <textarea
            id="feedback"
            readOnly
            value="No feedback available."
            style={{ resize: 'none', width: '100%', height: '100px' }}
          />
        )}
      </div>
    </div>
  );
}

export default DefaultPage;