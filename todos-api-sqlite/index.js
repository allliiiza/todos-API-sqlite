const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 4000;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database('./todos.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');

    // Create the todos table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS todos (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         task TEXT NOT NULL,
         completed BOOLEAN NOT NULL DEFAULT false,
         priority TEXT NOT NULL DEFAULT 'medium'
       )`,
      (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
        } else {
          console.log('Todos table is ready.');
        }
      }
    );
  }
});

// API Endpoints

// 1. GET /todos - Retrieve all to-do items or filter by completion status
app.get('/todos', (req, res) => {
  const { completed } = req.query;
  let query = 'SELECT * FROM todos';
  const params = [];

  if (completed !== undefined) {
    query += ' WHERE completed = ?';
    params.push(completed === 'true');
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).send('Error retrieving todos.');
    } else {
      res.json(rows);
    }
  });
});

// 2. POST /todos - Add a new to-do item
app.post('/todos', (req, res) => {
  const { task, priority = 'medium' } = req.body;

  db.run(
    `INSERT INTO todos (task, priority) VALUES (?, ?)`,
    [task, priority],
    function (err) {
      if (err) {
        res.status(500).send('Error adding todo.');
      } else {
        res.status(201).json({ id: this.lastID, task, completed: false, priority });
      }
    }
  );
});

// 3. PUT /todos/complete-all - Mark all to-do items as completed
app.put('/todos/complete-all', (req, res) => {
  db.run(`UPDATE todos SET completed = true`, [], function (err) {
    if (err) {
      res.status(500).send('Error completing all todos.');
    } else {
      res.json({ message: `All todos marked as completed.` });
    }
  });
});

// 4. DELETE /todos/:id - Delete a to-do item
app.delete('/todos/:id', (req, res) => {
  const id = req.params.id;

  db.run(`DELETE FROM todos WHERE id = ?`, id, function (err) {
    if (err) {
      res.status(500).send('Error deleting todo.');
    } else if (this.changes === 0) {
      res.status(404).send('To-Do item not found.');
    } else {
      res.status(204).send();
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
