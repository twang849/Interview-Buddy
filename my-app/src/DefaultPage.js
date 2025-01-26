import React, { useState } from 'react'
import './DefaultPage.css';

function DefaultPage() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleButtonClick = () => {
    document.getElementById('fileInput').click();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Submit button clicked');
    const formData = new FormData();
    console.log('Selected file:', file);
    formData.append('file', file);
  
    try {
      const res = await fetch('http://localhost:4000/upload', {
        method: 'POST',
        body: formData,
      });
      console.log('Response from server:', res);
      const data = await res.json();
      console.log('Parsed response data:', data);
      setResponse(data);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div>
      <title>Interview Helper</title>
        <h1 className="text">Interview Helper</h1>
        <h2 className="text">Submit audio files below</h2>
        
      
        <form className="text" onSubmit={handleSubmit}>
          <label htmlFor="fileInput">Choose an audio file: </label>
          <br/>
          <input
            type="file"
            id="fileInput"
            name="file"
            accept="audio/*"
            className="file-input"
            onChange={handleFileChange}
          />
          <br />
          <button type="button" className="custom-button" onClick={handleButtonClick}>
            {file ? file.name : "Browse"}
          </button>
          <br /><br />
          <input id="submit-button" type="submit" value="Upload" />
        </form>

        <div className="feedback-container">
          <label className="feedback-label" htmlFor="feedback">Feedback</label>
          <textarea id="feedback" className="feedback-box" value={response ? JSON.stringify(response, null, 2) : ''} readOnly></textarea>
        </div>
    </div>
  );
}

export default DefaultPage