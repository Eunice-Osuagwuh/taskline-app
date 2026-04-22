import express from 'express';
import pg from 'pg';

const app = express();
const PORT = process.env.PORT || 4000;

const pool = new pg.Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Simple tasks API
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  let taskCount = 0;
  try {
    const result = await pool.query('SELECT COUNT(*) FROM tasks');
    taskCount = result.rows[0].count;
  } catch (_) {}

  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP taskline_tasks_total Total number of tasks in the database
# TYPE taskline_tasks_total gauge
taskline_tasks_total ${taskCount}

# HELP taskline_backend_up Backend is reachable
# TYPE taskline_backend_up gauge
taskline_backend_up 1
`.trim());
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Taskline backend listening on port \${PORT}\`);
});
