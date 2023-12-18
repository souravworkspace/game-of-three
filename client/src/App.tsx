import React, { useEffect, useState } from 'react';
import './App.css';

const WS_URI_PREFIX = `ws://localhost:8080`;

const GameClient = () => {
  const [playerId, setPlayerId] = useState('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [showStartButton, setShowStartButton] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [automaticMode, setAutomaticMode] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    const id = path.substring(path.lastIndexOf('/') + 1);
    setPlayerId(id);

    const ws = new WebSocket(`${WS_URI_PREFIX}?playerId=${id}`);

    ws.onopen = () => {
      console.log(`WebSocket connected for Player ${id}`);
      setWebsocket(ws);
    };

    ws.onmessage = (event) => {
      console.log('event:', event.data);
      const data = JSON.parse(event.data.toString());
      if (data.type === 'INIT_STATE') {
        setCurrentPlayerId(data.state.currentPlayerId);
        setCurrentNumber(data.state.currentNumber);
        setHistory(data.history);
      } else if (data.type === 'ERROR' || data.type === 'INFO') {
        setMessageWithTimeout(data.message);
      } else if (data.type === 'READY') {
        setCurrentNumber(data.number);
        setShowStartButton(true);
      } else if (data.type === 'UPDATE_STATE') {
        setCurrentPlayerId(data.state.currentPlayerId);
        setCurrentNumber(data.state.currentNumber);
        setHistory(records => [...records, data.state.latestHistoryMsg]);
        if (id !== data.state.currentPlayerId) setShowStartButton(false);
        console.log('automaticMode:', automaticMode, id, data.state.currentPlayerId, data.state.currentNumber);
        if (automaticMode && id === data.state.currentPlayerId) {
          const nextMove = getAutomaticMove(data.state.currentNumber);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'MOVE', move: nextMove }));
          } else {
            console.error('Websocket not ready! Unable to make automatic move');
          }
        }
      }
    };

    return () => {
      if (websocket) {
        websocket.close();
        console.log('Connection closed');
      }
    };
  }, [automaticMode]); // Run when automaticMode changes or on component mount

  let messageTimeout: NodeJS.Timeout;

  const setMessageWithTimeout = (msg: string | null) => {
    if (messageTimeout) clearTimeout(messageTimeout);
    setMessage(msg);
    messageTimeout = setTimeout(() => {
      setMessage(null);
    }, 4000);
  };

  const sendMessageToServer = (message: {[key: string]: any}) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket connection is not open.');
    }
  };

  const handleStartClick = () => {
    sendMessageToServer({ type: 'START', number: currentNumber });
  };

  const handleMove = (move: number) => {
    sendMessageToServer({ type: 'MOVE', move });
  };

  const getAutomaticMove = (num: number) => {
    const rm = num % 3;
    return rm > 1 ? 1 : (0 - rm); 
  };

  const renderGameBoard = () => {
    if (!currentPlayerId) {
      return <div>Loading...</div>;
    }

    return (
      <div className='gameBoard'>
        <div>Playing Now: Player{currentPlayerId}</div>
        <div>Current Number: {currentNumber}</div>
        <div>
          <ul>
            {history.map((move: string, index: number) => (
              <li key={index}>{move}</li>
            ))}
          </ul>
        </div>
        {showStartButton && (
          <button onClick={handleStartClick}>Start</button>
        )}
        <div>
          <button onClick={() => handleMove(-1)}>Subtract 1</button>
          <button onClick={() => handleMove(0)}>Keep Number</button>
          <button onClick={() => handleMove(1)}>Add 1</button>
        </div>
        {message && <div className='message'>Message: {message}</div>}
      </div>
    );
  };

  const toggleAutomaticMode = () => {
    setAutomaticMode(!automaticMode);
  };

  return (
    <div className="App">
      <h1>Game of Three</h1>
      <h3>Welcome, Player {playerId}</h3>
      <button onClick={toggleAutomaticMode}>
        {automaticMode ? 'Stop Automatic Mode' : 'Start Automatic Mode'}
      </button>
      {renderGameBoard()}
    </div>
  );
};

export default GameClient;