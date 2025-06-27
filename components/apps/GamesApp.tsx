"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gamepad2, 
  Trophy, 
  Users, 
  Clock, 
  ArrowLeft,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

interface Game {
  id: string;
  name: string;
  icon: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  players: string;
  category: string;
}

const AVAILABLE_GAMES: Game[] = [
  {
    id: "snake",
    name: "Snake",
    icon: "🐍",
    description: "Classic snake game with modern twist",
    difficulty: "Easy",
    players: "1",
    category: "Arcade"
  },
  {
    id: "tictactoe",
    name: "Tic Tac Toe",
    icon: "⭕",
    description: "Strategic grid-based game",
    difficulty: "Easy",
    players: "2",
    category: "Strategy"
  },
  {
    id: "pong",
    name: "Pong",
    icon: "🏓",
    description: "Retro paddle ball game",
    difficulty: "Medium",
    players: "1-2",
    category: "Arcade"
  },
  {
    id: "puzzle",
    name: "Sliding Puzzle",
    icon: "🧩",
    description: "Number sliding puzzle challenge",
    difficulty: "Hard",
    players: "1",
    category: "Puzzle"
  },
  {
    id: "memory",
    name: "Memory Match",
    icon: "🧠",
    description: "Test your memory skills",
    difficulty: "Medium",
    players: "1",
    category: "Memory"
  },
  {
    id: "tetris",
    name: "Block Drop",
    icon: "🟦",
    description: "Falling blocks puzzle game",
    difficulty: "Hard",
    players: "1",
    category: "Puzzle"
  },
];

export function GamesApp() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameState, setGameState] = useState<"playing" | "paused" | "stopped">("stopped");
  const [score, setScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    setGameState("stopped");
    setScore(0);
  };

  const handleBackToMenu = () => {
    setSelectedGame(null);
    setGameState("stopped");
    setScore(0);
  };

  const startGame = () => {
    setGameState("playing");
    // Initialize the selected game
    if (selectedGame && canvasRef.current) {
      initializeGame(selectedGame.id);
    }
  };

  const pauseGame = () => {
    setGameState("paused");
  };

  const resetGame = () => {
    setGameState("stopped");
    setScore(0);
    if (selectedGame && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const initializeGame = (gameId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (gameId) {
      case "snake":
        initSnakeGame(ctx, canvas);
        break;
      case "tictactoe":
        initTicTacToeGame(ctx, canvas);
        break;
      case "pong":
        initPongGame(ctx, canvas);
        break;
      default:
        // Placeholder for other games
        ctx.fillStyle = "#4A90E2";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${selectedGame?.name} Game`, canvas.width / 2, canvas.height / 2);
        ctx.font = "16px Arial";
        ctx.fillText("Game implementation coming soon!", canvas.width / 2, canvas.height / 2 + 40);
    }
  };

  const initSnakeGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Simple snake game implementation
    let snake = [{ x: 200, y: 200 }];
    let food = { x: 300, y: 300 };
    let direction = { x: 20, y: 0 };
    let gameRunning = true;

    const drawGame = () => {
      if (!gameRunning || gameState !== "playing") return;

      // Clear canvas
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Move snake
      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

      // Check boundaries
      if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        gameRunning = false;
        setGameState("stopped");
        return;
      }

      snake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        food = {
          x: Math.floor(Math.random() * (canvas.width / 20)) * 20,
          y: Math.floor(Math.random() * (canvas.height / 20)) * 20
        };
      } else {
        snake.pop();
      }

      // Draw snake
      ctx.fillStyle = "#4CAF50";
      snake.forEach(segment => {
        ctx.fillRect(segment.x, segment.y, 18, 18);
      });

      // Draw food
      ctx.fillStyle = "#FF5722";
      ctx.fillRect(food.x, food.y, 18, 18);

      setTimeout(() => requestAnimationFrame(drawGame), 150);
    };

    // Keyboard controls
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          if (direction.y === 0) direction = { x: 0, y: -20 };
          break;
        case "ArrowDown":
        case "s":
          if (direction.y === 0) direction = { x: 0, y: 20 };
          break;
        case "ArrowLeft":
        case "a":
          if (direction.x === 0) direction = { x: -20, y: 0 };
          break;
        case "ArrowRight":
        case "d":
          if (direction.x === 0) direction = { x: 20, y: 0 };
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    drawGame();

    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      gameRunning = false;
    };
  };

  const initTicTacToeGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    let board = Array(9).fill("");
    let currentPlayer = "X";
    let gameOver = false;

    const drawBoard = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 3;
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(canvas.width / 3, 0);
      ctx.lineTo(canvas.width / 3, canvas.height);
      ctx.moveTo((canvas.width * 2) / 3, 0);
      ctx.lineTo((canvas.width * 2) / 3, canvas.height);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 3);
      ctx.lineTo(canvas.width, canvas.height / 3);
      ctx.moveTo(0, (canvas.height * 2) / 3);
      ctx.lineTo(canvas.width, (canvas.height * 2) / 3);
      ctx.stroke();

      // Draw X's and O's
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      
      board.forEach((mark, index) => {
        if (mark) {
          const row = Math.floor(index / 3);
          const col = index % 3;
          const x = col * (canvas.width / 3) + (canvas.width / 6);
          const y = row * (canvas.height / 3) + (canvas.height / 6) + 16;
          
          ctx.fillStyle = mark === "X" ? "#E74C3C" : "#3498DB";
          ctx.fillText(mark, x, y);
        }
      });
    };

    const handleClick = (e: MouseEvent) => {
      if (gameOver) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const col = Math.floor(x / (canvas.width / 3));
      const row = Math.floor(y / (canvas.height / 3));
      const index = row * 3 + col;

      if (board[index] === "") {
        board[index] = currentPlayer;
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        drawBoard();
        
        // Check for winner (simplified)
        // In a full implementation, you'd check all win conditions
      }
    };

    canvas.addEventListener("click", handleClick);
    drawBoard();

    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  };

  const initPongGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 5, dy: 3 };
    let paddle1 = { x: 10, y: canvas.height / 2 - 50, width: 10, height: 100 };
    let paddle2 = { x: canvas.width - 20, y: canvas.height / 2 - 50, width: 10, height: 100 };
    let gameRunning = true;

    const drawGame = () => {
      if (!gameRunning || gameState !== "playing") return;

      // Clear canvas
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Ball collision with top/bottom
      if (ball.y <= 0 || ball.y >= canvas.height) {
        ball.dy = -ball.dy;
      }

      // Ball collision with paddles
      if (ball.x <= paddle1.x + paddle1.width && ball.y >= paddle1.y && ball.y <= paddle1.y + paddle1.height) {
        ball.dx = -ball.dx;
      }
      if (ball.x >= paddle2.x && ball.y >= paddle2.y && ball.y <= paddle2.y + paddle2.height) {
        ball.dx = -ball.dx;
      }

      // Reset ball if it goes off screen
      if (ball.x < 0 || ball.x > canvas.width) {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        setScore(prev => prev + 1);
      }

      // Simple AI for paddle2
      if (ball.y > paddle2.y + paddle2.height / 2) {
        paddle2.y += 3;
      } else {
        paddle2.y -= 3;
      }

      // Draw everything
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ball.x, ball.y, 10, 10);
      ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
      ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

      requestAnimationFrame(drawGame);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          paddle1.y = Math.max(0, paddle1.y - 20);
          break;
        case "ArrowDown":
        case "s":
          paddle1.y = Math.min(canvas.height - paddle1.height, paddle1.y + 20);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    drawGame();

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      gameRunning = false;
    };
  };

  if (selectedGame) {
    return (
      <div className="h-full flex flex-col p-4">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBackToMenu}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedGame.icon}</span>
              <h2 className="text-xl font-bold">{selectedGame.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Score: {score}
            </Badge>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex items-center gap-2 mb-4">
          {gameState === "stopped" && (
            <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-1" />
              Start Game
            </Button>
          )}
          {gameState === "playing" && (
            <Button onClick={pauseGame} variant="outline">
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          {gameState === "paused" && (
            <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
          )}
          <Button onClick={resetGame} variant="outline">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        {/* Game Canvas */}
        <div className="flex-1 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="border-2 border-gray-300 rounded-lg bg-white"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        </div>

        {/* Game Instructions */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {selectedGame.id === "snake" && "Use WASD or arrow keys to control the snake. Eat the red food to grow!"}
            {selectedGame.id === "tictactoe" && "Click on the grid to place your mark. Get three in a row to win!"}
            {selectedGame.id === "pong" && "Use W/S or up/down arrows to control your paddle. Don't let the ball pass!"}
            {!["snake", "tictactoe", "pong"].includes(selectedGame.id) && selectedGame.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎮 Game Center</h2>
        <p className="text-gray-600">Choose from our collection of classic games</p>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AVAILABLE_GAMES.map((game) => (
          <Card
            key={game.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleGameSelect(game)}
          >
            <CardHeader className="text-center">
              <div className="text-4xl mb-2">{game.icon}</div>
              <CardTitle className="text-lg">{game.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{game.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={game.difficulty === "Easy" ? "default" : game.difficulty === "Medium" ? "secondary" : "destructive"}>
                  {game.difficulty}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {game.players}
                </Badge>
                <Badge variant="outline">
                  {game.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Scores */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Recent High Scores</h3>
        <div className="space-y-2">
          {[
            { game: "Snake", score: 450, time: "2 hours ago" },
            { game: "Pong", score: 120, time: "1 day ago" },
            { game: "Tic Tac Toe", score: 5, time: "3 days ago" },
          ].map((score, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{score.game}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{score.score} points</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {score.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}