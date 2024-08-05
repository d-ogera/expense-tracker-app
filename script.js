document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const expenseForm = document.getElementById('expense-form');

  // Add expense
  if (expenseForm) {
    expenseForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(expenseForm);
      const expense = formData.get('expense');
      const category = formData.get('category');
      const amount = formData.get('amount');

      try {
        const response = await fetch('/user/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            expense: expense,
            category: category,
            amount: amount
          })
        });

        if (response.ok) {
          alert('Expense added successfully');
        } else {
          const errorData = await response.json();
          alert(`Expense addition failed: ${errorData.message}`);
        }
      } catch (error) {
        console.error('An error occurred', error);
        alert('An error occurred while adding expense. Please try again later.');
      }
    });
  }

  // Fetch expenses data to chart
  fetch('/user/expenses')
    .then(response => response.json())
    .then(data => {
      const ctx = document.getElementById('expenseChart').getContext('2d');

      const labels = data.map(item => item.category);
      const amounts = data.map(item => item.amount);

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Expenses',
            data: amounts,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    })
    .catch(error => console.error('Error fetching data:', error));

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(registerForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const password = formData.get('password');
      const username = formData.get('username');

      try {
        const response = await fetch('/user/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            username: username
          })
        });

        if (response.ok) {
          alert('Registered successfully');
        } else {
          const errorData = await response.json();
          alert(`Registration failed: ${errorData.message}`);
        }
      } catch (error) {
        console.error('An error occurred', error);
        alert('An error occurred while registering. Please try again later.');
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(loginForm);
      const username = formData.get('username');
      const password = formData.get('password');

      try {
        const response = await fetch('/user/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        if (response.ok) {
          alert('Login successful');
        } else {
          const errorData = await response.json();
          alert(`Login failed: ${errorData.message}`);
        }
      } catch (error) {
        console.error('An error occurred', error);
        alert('An error occurred while logging in. Please try again later.');
      }
    });
  }

  // Add expenses data to table
  const fetchExpenses = () => {
    fetch('/user/expenses')
      .then(response => response.json())
      .then(data => {
        const table = document.getElementById('expenseTable');
        table.innerHTML = ''; // Clear existing table rows
        data.forEach(expense => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${expense.id}</td>
            <td>${expense.expense}</td>
            <td>${expense.category}</td>
            <td>${expense.amount}</td>
            <td><button class="btn btn-danger delete-btn" data-id="${expense.id}">Delete</button></td>
          `;
          table.appendChild(row);
        });

        // Add event listeners to delete buttons
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
          button.addEventListener('click', (event) => {
            const expenseId = event.target.getAttribute('data-id');
            deleteExpense(expenseId);
          });
        });
      })
      .catch(error => console.error('Error fetching data:', error));
  };

  const deleteExpense = (id) => {
    fetch(`/user/expenses/${id}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (response.ok) {
          alert('Expense deleted successfully');
          fetchExpenses(); // Refresh the table after deletion
        } else {
          response.json().then(data => {
            alert(`Expense deletion failed: ${data.message}`);
          });
        }
      })
      .catch(error => {
        console.error('An error occurred', error);
        alert('An error occurred while deleting expense. Please try again later.');
      });
  };

  fetchExpenses(); // Fetch and display expenses
});
