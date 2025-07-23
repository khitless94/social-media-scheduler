// EMERGENCY TEST COMPONENT - SIMPLE VERSION
import React, { useState } from 'react';

const CreatePost = () => {
  const [platform, setPlatform] = useState('');
  const [selectedSubreddit, setSelectedSubreddit] = useState('');

  return (
    <div style={{padding: '20px', backgroundColor: 'yellow', border: '5px solid red'}}>
      <h1 style={{color: 'red', fontSize: '24px'}}>🚨 EMERGENCY TEST - CAN YOU SEE THIS?</h1>
      <p>If you can see this yellow box, the component is updating!</p>
      <p>Platform selected: {platform}</p>
      
      <div style={{margin: '20px 0'}}>
        <h2>Select Platform:</h2>
        <button 
          onClick={() => setPlatform('reddit')}
          style={{
            padding: '10px 20px', 
            margin: '5px', 
            backgroundColor: platform === 'reddit' ? 'orange' : 'white',
            border: '2px solid black'
          }}
        >
          Reddit
        </button>
        <button 
          onClick={() => setPlatform('twitter')}
          style={{
            padding: '10px 20px', 
            margin: '5px', 
            backgroundColor: platform === 'twitter' ? 'lightblue' : 'white',
            border: '2px solid black'
          }}
        >
          Twitter
        </button>
      </div>
      
      {platform === 'reddit' && (
        <div style={{backgroundColor: 'lightblue', padding: '10px', margin: '10px 0'}}>
          <h2>REDDIT SECTION</h2>
          <label>Subreddit:</label>
          <select 
            value={selectedSubreddit} 
            onChange={(e) => setSelectedSubreddit(e.target.value)}
            style={{padding: '5px', margin: '5px'}}
          >
            <option value="">Choose subreddit...</option>
            <option value="test">r/test</option>
            <option value="testingground4bots">r/testingground4bots</option>
            <option value="SandBoxTest">r/SandBoxTest</option>
          </select>
          <p>Selected: {selectedSubreddit}</p>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
