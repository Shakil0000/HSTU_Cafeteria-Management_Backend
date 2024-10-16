const express = require('express');
const multer = require('multer');
const cors = require('cors'); // Import the cors middleware
const path = require('path');
const app = express();
const port = 5000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json()); // Parses incoming requests with JSON payloads



const mysql = require('mysql');
const { stringify } = require('querystring');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',       // Your MySQL host (usually localhost)
  user: 'root',    // Your MySQL username
  password: '',// Your MySQL password
  database: 'academyproject' // The name of the database you want to connect to
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});


// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set the destination folder for uploads
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original name of the file
  }
});

// Initialize multer with storage
const upload = multer({ storage: storage });


// Serve static files from the "uploads" directory(we can any get any pic from uploads folder by http://localhost:5000/uploads/PicName)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// post
app.post('/posOffertItem', upload.single('image'), (req, res) => {
  const { title, price, offer, description, productType} = req.body;
  const image = req.file;
  res.json({ message: 'Offer item uploaded successfully!', data: req.body });
  // SQL query to insert data into offeritem table
  const sql = `INSERT INTO offeritem (title, price, picPath, description, offer, ProductType) VALUES (?, ?, ?, ?, ?, ?)`;
  // Values to be inserted
  const values = [title, price, image.originalname, description, offer, productType]; 
  // Execute the SQL query
  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error inserting data into database:', err.stack);
      // Send the error response and exit the function
      return res.status(500).json({ error: 'Failed to insert data into the database' });
    }
    console.log('Data inserted successfully:', results.insertId);
  });
});



app.post('/addItemToCart', (req, res) => {
  const { ProductId, Category, Quantity, UserName, UserId } = req.body;

  // Log the received data to verify
  console.log('Received data:', req.body);

  // Validate required fields
  if (!ProductId || !Category || !Quantity || !UserName) {
    return res.status(400).send('Missing required fields');
  }

  // SQL query to insert data
  const sql = 'INSERT INTO addtocart (ProductId, Category, Quantity, UserName, UserId) VALUES (?, ?, ?, ?, ?)';
  connection.query(sql, [ProductId, Category, Quantity, UserName, UserId], (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      return res.status(500).send('Server Error');
    }
    res.status(200).send('Data inserted successfully');
  });
});



// Get
app.get('/offer-items', (req, res) => {
  const sql = 'SELECT * FROM offeritem WHERE ProductType = "Package"';

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error querying database:', err.stack);
      return res.status(500).json({ error: 'Failed to retrieve data' });
    }    
    // Send results as JSON
    res.json(results);
    console.log(results)
  });
});






// Get
app.get('/offer-items-individual', (req, res) => {
  const sql = 'SELECT * FROM offeritem WHERE ProductType = "Individual"';

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error querying database:', err.stack);
      return res.status(500).json({ error: 'Failed to retrieve data' });
    }    
    // Send results as JSON
    res.json(results);
    console.log(results)
  });
});






// Get
app.get('/offerDescription/:id', (req, res) => {
  const {id} = req.params;
  const sql = `SELECT * FROM offeritem where id = ${id}`;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error querying database:', err.stack);
      return res.status(500).json({ error: 'Failed to retrieve data' });
    }    
    // Send results as JSON
    res.json(results);
    console.log(results)
  });
});


// Get
app.get('/DisplayItemToAddToCart/:id', (req, res) => {
  const {id} = req.params;
  const sql = `SELECT ProductId FROM addtocart where UserId = ${id}`;

  connection.query(sql, (err, results) => {
    let data = [];
    if (err) {
      console.error('Error querying database:', err.stack);
      return res.status(500).json({ error: 'Failed to retrieve data' });
    }
    else{
      const len = results.length - 1;
      results.map((value, index) =>{
        let sql2 = `SELECT * FROM offeritem where id = ${value.ProductId}`;
        connection.query(sql2, (err2, results2) => {
        if (err2) {
        console.error('Error for querying 2 database:', err2.stack);
        return res.status(500).json({ error: 'Failed to retrieve data for request 2' });
        }
        data.push(results2[0])
        if(len == index){
          res.json(data);
          console.log(data)
        }
        })
      })
    }   
    
  });
});


// Route to delete an item from the addtocart table
app.delete('/deleteItemfromAddtoCart/:id', (req, res) => {
  const itemId = req.params.id;
  const sql = `DELETE FROM addtocart WHERE ProductId = ?`;

  connection.query(sql, [itemId], (err, result) => {
    if (err) {
      console.error('Error deleting item:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete item.' });
    }

    res.json({ success: true, message: 'Item deleted successfully.' });
  });
});


// SineUp Page For Creating Account
app.post('/signup', (req, res) => {
  const { userName, password, phoneNumber, hallName, roomNumber, studentId } = req.body;

  const query = 'INSERT INTO student (userName, password, phoneNumber, hallName, roomNumber, studentId) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(query, [userName, password, phoneNumber, hallName, roomNumber, studentId], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
});



// Backend: Node.js code to handle login and return user id
app.post('/login', (req, res) => {
  const { userName, password } = req.body;
  const query = 'SELECT * FROM student WHERE userName = ? AND password = ?';
  
  connection.query(query, [userName, password], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ success: false });
    }

    if (results.length > 0) {
      // Extract user id and userName from results
      const { id, userName } = results[0];
      res.json({ success: true, id, userName });
    } else {
      res.json({ success: false });
    }
  });
});




app.post('/addOrder', (req, res) => {
  const { userId, totalCost, totalItems, DeliveryCost, time, Description } = req.body;
  const descriptionJson = JSON.stringify(Description);
  const uniqueNumber = Date.now();
  // Prepare the SQL query to insert order details
  const orderQuery = `INSERT INTO orderitem (userId, totalCost, totalItems, DeliveryCost, time, Description, DeliveryStatus, DeliveryBoyFee, ConfirmToken) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  // Insert the main order details
  connection.query(orderQuery, [userId, totalCost, totalItems, DeliveryCost, time, descriptionJson, "Not Delivered", "Unpaid", uniqueNumber], (error, results) => {
    if (error) {
      return res.status(500).json({ success: false, message: 'Error inserting order', error });
    }
     res.status(200).json({ success: true, message: 'Order inserted successfully' });

  });
});





// Get Data for order for specific user
app.get('/getUserOrderItem/:id', (req, res) => {
  const id = req.params.id; // Get the id from the URL parameters

  // Query to fetch data where id matches
  const query = `SELECT * FROM orderitem WHERE userId = ? and DeliveryStatus = 'Not Delivered'`;

  // Execute the query
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      return res.status(500).send('An error occurred while fetching data');
    }
    
    // Send the fetched data as response
    res.status(200).json(results);
  });
});




// Signup Employee
app.post('/signupEmployee', (req, res) => {
  const { name, password, occupationType, phoneNumber, email } = req.body;
  const query =
    'INSERT INTO employee (Name, Password, OccupationType, PhoneNumber, Email, EmploymentStatus, CV) VALUES (?, ?, ?, ?, ?, ?, ?)';

  connection.query(query, [name, password, occupationType, phoneNumber, email, "Not Applied", null], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.json({ success: false });
    } else {
      res.json({ success: true });
    }
  });
});





// Employee Login route
app.post('/loginEmployee', (req, res) => {
  const { name, password } = req.body;
  const query = 'SELECT id, Name, OccupationType FROM employee WHERE Name = ? AND Password = ?';

  connection.query(query, [name, password], (err, results) => {
    if (err) {
      console.error('Error checking credentials:', err);
      res.json({ success: false });
    } else if (results.length > 0) {
      // If the credentials match, send success, employee's name, and occupation type
      res.json({ success: true, id: results[0].id, name: results[0].Name, occupationType: results[0].OccupationType });
    } else {
      // If no match is found, return failure
      res.json({ success: false });
    }
  });
});




// Get Employee Data
app.get('/getEmployeeData/:id', (req, res) => {
  const employeeId = req.params.id;

  // Query to get Name, OccupationType, and EmploymentStatus
  const query = 'SELECT * FROM employee WHERE id = ?';

  connection.query(query, [employeeId], (error, results) => {
    if (error) {
      res.status(500).json({ error: 'Database query failed' });
    } else if (results.length === 0) {
      res.status(404).json({ message: 'No employee found' });
    } else {
      res.json(results[0]);
    }
  });
});


// Upload CV of Employee that's meaning Applied to the Job 
app.post('/updateCvLink', (req, res) => {
  const { id, cvLink } = req.body;
  const sql = 'UPDATE employee SET CV = ?, EmploymentStatus = ? WHERE id = ?';
  connection.query(sql, [cvLink, "Unemployed", id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error updating CV link');
    }
    res.send('CV link updated successfully');
  });
});




// API route to get completed orders for the delivery boy
app.get('/getCompletedOrders/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;
  const query = `SELECT * FROM orderitem WHERE DeliveryBoyId = ? AND DeliveryStatus = 'Delivered'`;

  connection.query(query, [employeeId], (error, results) => {
    if (error) {
      console.error('Error fetching completed orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    res.json(results);
  });
});





// API route to get Booked orders for the delivery boy
app.get('/getBookedOrders/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;
  const query = `SELECT * FROM orderitem WHERE DeliveryBoyId = ? AND DeliveryStatus = 'Not Delivered'`;

  connection.query(query, [employeeId], (error, results) => {
    if (error) {
      console.error('Error fetching completed orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    res.json(results);
  });
});





// API route to Take orders for the delivery boy
app.get('/getTakeOrders/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;
  const query = `SELECT * FROM orderitem WHERE DeliveryBoyId = 0 and DeliveryStatus = 'Not Delivered'`;

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching completed orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    res.json(results);
  });
});



// API to get employee data for EmploymentStatus = 'Employed'
app.get('/getEmployeeDataForEmployed', (req, res) => {
  const sql = 'SELECT * FROM employee WHERE EmploymentStatus = "Employed"';
  
  connection.query(sql, (err, result) => {
      if (err) {
          console.error('Error fetching employed employees:', err);
          res.status(500).send('Server error');
      } else {
          res.json(result); // Send the data as JSON to the client
      }
  });
});




// Api to get Unpaid delivery and Employee bills based on date and EmployeeId
app.post('/getUnpaidDeliveryCount/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  const { date } = req.body;  // Extract date from the request body
  
  // SQL query with parameterized inputs to prevent SQL injection
  const sql = `
    SELECT COUNT(*) AS count 
    FROM orderitem 
    WHERE SUBSTRING_INDEX(time, ',', 1) = ? 
    AND DeliveryBoyId = ? 
    AND DeliveryBoyFee = 'Unpaid'
  `;
  // Use connection.query with placeholders for the query parameters
  connection.query(sql, [date, employeeId], (err, result) => {
    if (err) {
      console.error('Error fetching unpaid delivery count:', err);
      res.status(500).send('Server error');
    } else {
      res.json(result[0]); // Send the result to the frontend
    }
  });
});





// POST route to handle bill submission
app.post('/submitEmployeeBill', (req, res) => {
  const bills = req.body; // Expecting an array of bill data

  const sqlQuery = `
      INSERT INTO employeebillperday (EmployeeId, EmployeeName, JobCatagory, EventOrHours, PerEventOrHoursBill, Total, Date, BillState)
      VALUES ?`;

  const values = bills.map(bill => [
      bill.employeeId,
      bill.name,
      bill.jobCategory,
      bill.eventOrHours,
      bill.perEventOrHoursBill,
      bill.total,
      bill.date,
      bill.billState
  ]);

  connection.query(sqlQuery, [values], (err, result) => {
      if (err) {
          console.error('Error inserting data into employeebillperday:', err);
          return res.status(500).json({ message: 'Error inserting data' });
      }
      res.status(200).json({ message: 'Data inserted successfully', result });
  });
});




// Route to get all data from the employeebillperday table
app.get('/getEmployeeBill/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;

  // SQL query to fetch data from employeebillperday table based on employeeId
  const query = 'SELECT * FROM employeebillperday WHERE EmployeeId = ?';

  connection.query(query, [employeeId], (error, results) => {
      if (error) {
          console.error('Error fetching employee bill data:', error);
          res.status(500).send('Error fetching employee bill data');
      } else {
          res.status(200).json(results);
      }
  });
});




app.get('/getAllDataFromOfferItems', (req, res) => {
  const sqlQuery = 'SELECT * FROM offeritem';

  connection.query(sqlQuery, (err, results) => {
      if (err) {
          console.error('Error fetching data from offeritem table:', err);
          return res.status(500).json({ message: 'Error fetching data' });
      }
      res.status(200).json(results);
  });
});




// Endpoint to get all 'Not Delivered' items
app.get('/getNotDeliveredItems', (req, res) => {
  const query = `SELECT * FROM orderitem WHERE DeliveryStatus = 'Not Delivered'`;

  connection.query(query, (err, results) => {
      if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({ error: 'Database query error' });
      }

      // Return the results as JSON
      res.json(results);
  });
});





// API endpoint to get all employees
app.get('/getAllEmployees', (req, res) => {
  const sql = 'SELECT * FROM employee';  // Query to fetch all data from employee table

  connection.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching employee data');
    } else {
      res.json(result);  // Send the result back as a JSON response
    }
  });
});





// API route to insert administrator
app.post('/addAdministrator', (req, res) => {
  const { name, password, phoneNumber, email } = req.body;

  const sql = 'INSERT INTO administrator (Name, Password, PhoneNumber, Email) VALUES (?, ?, ?, ?)';
  connection.query(sql, [name, password, phoneNumber, email], (err, result) => {
      if (err) {
          console.error('Error inserting administrator:', err);
          res.status(500).send('Error inserting administrator');
      } else {
          res.status(200).send('Administrator inserted successfully');
      }
  });
});






// API route to get all administrators (excluding id and password)
app.get('/getAllAdministrators', (req, res) => {
  const sql = 'SELECT Name, PhoneNumber, Email FROM administrator';
  connection.query(sql, (err, results) => {
      if (err) {
          console.error('Error fetching administrators:', err);
          res.status(500).send('Error fetching administrators');
      } else {
          res.status(200).json(results);
      }
  });
});






// Route to get data from offeritem table based on id
app.get('/getOfferItem/:id', (req, res) => {
  const offerItemId = req.params.id;
  
  const query = 'SELECT * FROM offeritem WHERE id = ?';
  
  connection.query(query, [offerItemId], (err, result) => {
      if (err) {
          console.error('Error fetching offer item:', err);
          res.status(500).json({ message: 'Error fetching offer item' });
      } else if (result.length === 0) {
          res.status(404).json({ message: 'Offer item not found' });
      } else {
          res.status(200).json(result);
      }
  });
});




// Rout that change Employment Status to Employed 
app.put('/updateEmployeeStatus/:id', async (req, res) => {
  const { id } = req.params;
  const { EmploymentStatus } = req.body;
  
  try {
    await connection.query('UPDATE employee SET EmploymentStatus = ? WHERE id = ?', [EmploymentStatus, id]);
    res.status(200).send('Employee status updated successfully');
  } catch (error) {
    res.status(500).send('Error updating employee status');
  }
});






// DELETE based on id from offeritem table
app.delete('/deleteOfferItem/:id', (req, res) => {
  const { id } = req.params;

  // SQL query to delete the offer item based on the ID
  const query = 'DELETE FROM offeritem WHERE id = ?';

  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting offer item:', err);
      return res.status(500).json({ message: 'Error deleting offer item' });
    }

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Offer item deleted successfully' });
    } else {
      res.status(404).json({ message: 'Offer item not found' });
    }
  });
});







// Delete from orderitem based on id
app.delete('/deleteOrder/:id', (req, res) => {
  const orderId = req.params.id;

  // SQL query to delete the order based on ID
  const sql = 'DELETE FROM orderitem WHERE id = ?';
  
  connection.query(sql, [orderId], (err, result) => {
    if (err) {
      console.error('Error deleting order:', err);
      return res.status(500).json({ message: 'Error deleting order' });
    }
    
    res.status(200).json({ message: 'Order deleted successfully' });
  });
});






// Check to Login of Administrator that Name and Password is correct
app.post('/adminLogin', (req, res) => {
  const { name, password } = req.body;

  // Query to find the administrator by name and password
  connection.query('SELECT * FROM administrator WHERE Name = ? AND Password = ?', [name, password], (error, results) => {
      if (error) {
          console.error('Error in /adminLogin:', error);
          return res.status(500).json({
              success: false,
              message: 'Server error. Please try again later.',
          });
      }

      if (results.length > 0) {
          const administrator = results[0];
          res.json({
              success: true,
              name: administrator.Name,
              id: administrator.id,
          });
      } else {
          res.json({
              success: false,
              message: 'Invalid Name or Password',
          });
      }
  });
});





// Rout to take order by Delivery Boy by updating DeliveryBoyId
app.put('/takeOrder/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { employeeId } = req.body;

  const sqlQuery = 'UPDATE orderitem SET DeliveryBoyId = ? WHERE id = ?';
  
  connection.query(sqlQuery, [employeeId, orderId], (error, result) => {
    if (error) {
      return res.status(500).send(error);
    }
    res.send({ message: 'Order updated successfully' });
  });
});






// Confirm order delivery by checking ConfirmToken, Updating Not Delivery to Delivery
app.put('/confirmDelivery/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { confirmToken } = req.body;

  const sqlCheckToken = 'SELECT ConfirmToken FROM orderitem WHERE id = ?';
  const sqlUpdateStatus = 'UPDATE orderitem SET DeliveryStatus = "Delivered" WHERE id = ?';

  connection.query(sqlCheckToken, [orderId], (error, results) => {
    if (error) {
      return res.status(500).send({ success: false, error: 'Error checking token' });
    }

    if (results.length > 0 && results[0].ConfirmToken === confirmToken) {
      connection.query(sqlUpdateStatus, [orderId], (updateError) => {
        if (updateError) {
          return res.status(500).send({ success: false, error: 'Error updating delivery status' });
        }
        res.send({ success: true });
      });
    } else {
      res.send({ success: false, error: 'Invalid token' });
    }
  });
});





app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
