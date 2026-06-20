import { useState, useEffect } from "react";
import { socket } from "./socket";
import "./App.css";
import Confetti from "react-confetti";

function App() {
  const [room, setRoom] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [board, setBoard] = useState(Array(9).fill(""));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winner, setWinner] = useState("");
  const [draw, setDraw] = useState(false);
  const [moveSound] = useState(() => new Audio("/sounds/move.mp3"));
const [winSound] = useState(() => new Audio("/sounds/win.mp3"));
const [drawSound] = useState(() => new Audio("/sounds/draw.mp3"));
  const [player, setPlayer] = useState("");
  const [playersCount, setPlayersCount] = useState(0);

  const [xName, setXName] = useState("");
  const [oName, setOName] = useState("");

  const [xScore, setXScore] = useState(0);
  const [oScore, setOScore] = useState(0);
  const [drawScore, setDrawScore] = useState(0);

  const createRoom = () => {
    if (!playerName) {
      alert("Please enter your name");
      return;
    }

    const roomId = Math.floor(1000 + Math.random() * 9000).toString();

    setRoom(roomId);

    socket.emit("join_room", {
      room: roomId,
      name: playerName,
    });
  };

  const joinRoom = () => {
    if (!playerName) {
      alert("Please enter your name");
      return;
    }

    if (room !== "") {
      socket.emit("join_room", {
        room,
        name: playerName,
      });
    }
  };

  useEffect(() => {
    socket.on("receive_move", (data) => {
      setBoard(data.board);
      setIsXTurn(data.isXTurn);
      setWinner(data.winner);
      setDraw(data.draw);

      setXScore(data.xScore);
      setOScore(data.oScore);
      setDrawScore(data.drawScore);
    });

    socket.on("players_info", (data) => {
      setXName(data.xName);
      setOName(data.oName);
    });

    socket.on("player_assignment", (data) => {
      setPlayer(data);
    });

    socket.on("players_count", (count) => {
      setPlayersCount(count);
    });

    socket.on("restart_board", () => {
      setBoard(Array(9).fill(""));
      setWinner("");
      setDraw(false);
      setIsXTurn(true);
    });

    socket.on("room_full", () => {
      alert("Room is full!");
    });

    return () => {
      socket.off("receive_move");
      socket.off("players_info");
      socket.off("player_assignment");
      socket.off("players_count");
      socket.off("restart_board");
      socket.off("room_full");
    };
  }, []);

  const checkWinner = (currentBoard) => {
    const patterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let pattern of patterns) {
      const [a, b, c] = pattern;

      if (
        currentBoard[a] &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return {
          winner: currentBoard[a],
          draw: false,
        };
      }
    }

    if (!currentBoard.includes("")) {
      return {
        winner: "",
        draw: true,
      };
    }

    return {
      winner: "",
      draw: false,
    };
  };

  const handleClick = (index) => {
    if (playersCount < 2) return;

    if (
      (player === "X" && !isXTurn) ||
      (player === "O" && isXTurn)
    ) {
      return;
    }

    if (winner || draw || board[index] !== "") return;

    const newBoard = [...board];
    newBoard[index] = isXTurn ? "X" : "O";

    const result = checkWinner(newBoard);

    let newXScore = xScore;
    let newOScore = oScore;
    let newDrawScore = drawScore;

    if (result.winner === "X") {
      newXScore++;
       winSound.play();

    }

    if (result.winner === "O") {
      newOScore++;
    winSound.play();
    }

    if (result.draw) {
      newDrawScore++;
     drawSound.play();
    }

    moveSound.play();
    setBoard(newBoard);
    setWinner(result.winner);
    setDraw(result.draw);

    setXScore(newXScore);
    setOScore(newOScore);
    setDrawScore(newDrawScore);

    const nextTurn =
      !result.winner && !result.draw
        ? !isXTurn
        : isXTurn;

    setIsXTurn(nextTurn);

    socket.emit("send_move", {
      room,
      board: newBoard,
      isXTurn: nextTurn,
      winner: result.winner,
      draw: result.draw,
      xScore: newXScore,
      oScore: newOScore,
      drawScore: newDrawScore,
    });
  };

  const restartGame = () => {
    socket.emit("restart_game", room);
  };

return (
  <div className="App">

    {winner && (
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={400}
      />
    )}

    {/* Title */}
    <h1>🟢 Tic Tac Toe Multiplayer</h1>

    {/* Controls */}
    <div className="controls">

      <input
        type="text"
        placeholder="👤 Enter Your Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />

      <input
        type="text"
        placeholder="🏠 Enter Room ID"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />

      <button onClick={createRoom}>
        ➕ Create Room
      </button>

      <button onClick={joinRoom}>
        🚪 Join Room
      </button>

      <button onClick={() => navigator.clipboard.writeText(room)}>
        📋 Copy Room ID
      </button>

    </div>

    {/* Players */}
    <div className="players">

      <div className="player-card">
        <h2>🧑‍🚀 Player X</h2>
        <h3>{xName || "Waiting..."}</h3>
        <h3>🏆 {xScore}</h3>
      </div>

      <div className="turn-card">

        {!winner && !draw && (
          <>
            <h2>👑 Current Turn</h2>
            <h2>
              {isXTurn
                ? `${xName || "Player X"} (X)`
                : `${oName || "Player O"} (O)`}
            </h2>
          </>
        )}

        {winner && (
          <div className="winner">
            🎉 Winner <br />
            {winner === "X" ? xName : oName}
          </div>
        )}

        {draw && (
          <div className="draw">
            🤝 Match Draw
          </div>
        )}

      </div>

      <div className="player-card">
        <h2>🤖 Player O</h2>
        <h3>{oName || "Waiting..."}</h3>
        <h3>🏆 {oScore}</h3>
      </div>

    </div>


    {/* Board */}
    <div className="board">

      {board.map((value, index) => (
        <button
          key={index}
          className="cell"
          onClick={() => handleClick(index)}
        >
          {value}
        </button>
      ))}

    </div>


    {/* Match Stats */}
    <div className="stats-card">

      <h2>📊 Match Stats</h2>

      <h3>🤝 Draws : {drawScore}</h3>

      <h3>👥 Players Online : {playersCount}</h3>

      {playersCount < 2 ? (
        <h3 className="waiting">
          🟡 Waiting for opponent...
        </h3>
      ) : (
        <h3 className="connected">
          🟢 Opponent Connected
        </h3>
      )}

      <h3>🏠 Room : {room}</h3>

    </div>


    {/* Restart */}
    {(winner || draw) && (
      <button className="restart-btn" onClick={restartGame}>
        🔄 Restart Game
      </button>
    )}

  </div>
);
}

export default App;