const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');
const mysql = require('mysql2');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const tempDir = './temp';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// MySQL setup
const db = mysql.createConnection({
  host: '127.0.0.1',       // Use IPv4
  user: 'root',             // XAMPP default user
  password: '',             // usually empty for XAMPP
  database: 'testdb'        // make sure database exists in phpMyAdmin
});


db.connect(err => { if(err) console.log('MySQL Error:', err); });

// MongoDB setup
const mongoUrl = 'mongodb://localhost:27017';
const mongoClient = new MongoClient(mongoUrl);
let mongoDb;
mongoClient.connect().then(client => { mongoDb = client.db('testdb'); console.log('MongoDB connected'); });

app.post('/run', async (req, res) => {
  const { language, code } = req.body;
  const fileName = `${tempDir}/temp`;

  try {
    if(language === 'JavaScript') {
      const result = eval(code);
      res.json({ output: result !== undefined ? result : 'JS executed' });
    }
    else if(language === 'Python') {
      fs.writeFileSync(`${fileName}.py`, code);
      exec(`python ${fileName}.py`, (err, stdout, stderr) => {
        res.json({ output: err ? stderr : stdout });
      });
    }
    else if(language === 'Java') {
      fs.writeFileSync(`${fileName}.java`, code);
      exec(`javac ${fileName}.java && java -cp ${tempDir} temp`, (err, stdout, stderr) => {
        res.json({ output: err ? stderr : stdout });
      });
    }
    else if(language === 'C++') {
      fs.writeFileSync(`${fileName}.cpp`, code);
      exec(`g++ ${fileName}.cpp -o ${tempDir}/temp && ${tempDir}/temp`, (err, stdout, stderr) => {
        res.json({ output: err ? stderr : stdout });
      });
    }
    else if(language === 'NodeJS') {
      fs.writeFileSync(`${fileName}.js`, code);
      exec(`node ${fileName}.js`, (err, stdout, stderr) => {
        res.json({ output: err ? stderr : stdout });
      });
    }
    else if(language === 'React') {
      res.json({ output: 'React code must be compiled using npm. Not supported live in this compiler.' });
    }
    else if(language === 'MySQL') {
      db.query(code, (err, results) => {
        res.json({ output: err ? err.message : JSON.stringify(results, null, 2) });
      });
    }
    else if(language === 'MongoDB') {
      const collection = mongoDb.collection('test');
      try {
        const query = JSON.parse(code);
        const result = await collection.find(query).toArray();
        res.json({ output: JSON.stringify(result, null, 2) });
      } catch(e) {
        res.json({ output: 'MongoDB Error: ' + e.message });
      }
    }
    else if(language === 'HTML') {
      res.json({ output: `<iframe style="width:100%;height:300px;border:1px solid #ccc;">${code}</iframe>` });
    }
    else if(language === 'CSS') {
      res.json({ output: `CSS Applied: ${code}` });
    } else {
      res.json({ output: 'Language not supported' });
    }
  } catch(e) {
    res.json({ output: 'Error: '+e.message });
  }
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));