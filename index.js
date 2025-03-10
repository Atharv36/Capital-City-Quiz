import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database connection
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

const app = express();
const port = 3000;

let quiz = [];

// Fetch quiz data dynamically on each request
async function fetchQuizData() {
  try {
    const res = await db.query("SELECT * FROM capitals");
    quiz = res.rows;
  } catch (err) {
    console.error("Error executing query:", err.stack);
  }
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentQuestion = {};
let totalCorrect = 0;

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  await fetchQuizData();
  await nextQuestion();
  res.render("index.ejs", { question: currentQuestion });
});

// POST a new answer
app.post("/submit", async (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;

  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    isCorrect = true;
  }

  await nextQuestion();
  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

// Pick a random question
async function nextQuestion() {
  if (quiz.length === 0) {
    await fetchQuizData();
  }
  if (quiz.length > 0) {
    currentQuestion = quiz[Math.floor(Math.random() * quiz.length)];
  } else {
    console.error("No data available in the database.");
  }
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
