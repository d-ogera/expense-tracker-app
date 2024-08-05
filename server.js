const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const { check, validationResult } = require('express-validator');
const port = 4800;

// Initialize the application
const app = express();

// Configure middlewares
app.use(session({
  secret: 'kkdhfgrugghgn-lnitj-9968-j-iti',
  resave: false,
  saveUninitialized: false,
}));

// Middleware for handling incoming requests
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

// Connect to database server
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'my_users'
});

// Connect to database
connection.connect((error) => {
  if (error) {
    console.log('Error connecting to db server: ' + error.stack);
    return;
  }
  console.log('Connected to database server');
});

// Define middleware to check if user is authenticated
const userAuthenticated = (request, response, next) => {
  if (request.session.user) {
    return next();
  } else {
    response.redirect('/login');
  }
};

// Define routes
app.get('/register', (request, response) => {
  response.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/login', (request, response) => {
  response.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/expenses', userAuthenticated, (request, response) => {
  response.sendFile(path.join(__dirname, 'expenses.html'));
});

app.get('/dashboard', userAuthenticated, (request, response) => {
  response.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Define a user object registration
const user = {
  tableName: 'users',
  createUser: function(newUser, callback) {
    connection.query('INSERT INTO ' + this.tableName + ' SET ?', newUser, callback);
  },
  getUserByEmail: function(email, callback) {
    connection.query('SELECT * FROM ' + this.tableName + ' WHERE email = ?', [email], callback);
  },
  getUserByUsername: function(username, callback) {
    connection.query('SELECT * FROM ' + this.tableName + ' WHERE username = ?', [username], callback);
  },
}

// Define the add expense logic
app.post('/user/expenses', userAuthenticated, (req, res) => {
  const { expense, category, amount } = req.body;

  if (!expense || !category || !amount) {
    return res.status(400).send('Expense, category, and amount are required');
  }

  const query = 'INSERT INTO expenses (expense, category, amount) VALUES (?, ?, ?)';
  connection.query(query, [expense, category, amount], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'An error occurred while adding expense. Please try again later.' });
    }
    res.status(201).json({ message: 'Expense added successfully' });
  });
});

// Define delete route for an expense
app.delete('/user/expenses/:id', userAuthenticated, (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM expenses WHERE id = ?', [id], (error, results) => {
    if (error) {
      console.error('Error deleting expense:', error);
      return res.status(500).json({ message: 'An error occurred while deleting expense.' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Expense not found.' });
    }
    res.status(200).json({ message: 'Expense deleted successfully' });
  });
});

// Define registration logic
app.post('/user/register', [
  check('email').isEmail().withMessage('Provide a valid email'),
  check('username').isAlphanumeric().withMessage('Invalid Username, not alphanumeric'),
  check('email').custom(async (value) => {
    return new Promise((resolve, reject) => {
      user.getUserByEmail(value, (error, results) => {
        if (error) {
          reject(new Error('Server Error'));
        }
        if (results.length > 0) {
          reject(new Error('Email already in use'));
        }
        resolve(true);
      });
    });
  }),
  check('username').custom(async (value) => {
    return new Promise((resolve, reject) => {
      user.getUserByUsername(value, (error, results) => {
        if (error) {
          reject(new Error('Server Error'));
        }
        if (results.length > 0) {
          reject(new Error('Username already in use'));
        }
        resolve(true);
      });
    });
  })
], async (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() });
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);

  const newUser = {
    name: request.body.name,
    email: request.body.email,
    username: request.body.username,
    password: hashedPassword
  }

  user.createUser(newUser, (error) => {
    if (error) {
      console.error('Error occurred while saving record: ' + error.message);
      return response.status(500).json({ error: error.message });
    }
    console.log('New user record saved');
    response.status(201).send('Registration successful');
  });
});

// Handle login logic
app.post('/user/login', (request, response) => {
  const { username, password } = request.body;

  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      return response.status(401).send('Invalid username or password');
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
        request.session.user = user;
        response.redirect('/dashboard');
      } else {
        response.status(401).send('Invalid username or password');
      }
    });
  });
});

// Data sent to the table
app.get('/user/expenses', userAuthenticated, (req, res) => {
  const sql = 'SELECT id, expense, category, amount FROM expenses';
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching data from the database:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

// Kill a session
app.get('/logout', (request, response) => {
  request.session.destroy();
  response.redirect('/login');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
