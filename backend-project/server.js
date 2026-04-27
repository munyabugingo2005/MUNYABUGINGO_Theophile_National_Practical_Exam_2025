require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();

const PORT = process.env.PORT || 10000;

// ---------------- MIDDLEWARE ----------------
app.use(cors({
 origin: [
   "http://localhost:3000",
   "http://localhost:5173"
 ],
 credentials:true
}));

app.use(express.json());

app.use(session({
 secret: process.env.SESSION_SECRET || "smartpark_secret",
 resave:false,
 saveUninitialized:false,
 cookie:{
   secure:false,
   maxAge:86400000
 }
}));


// ---------------- DATABASE ----------------
let db;
let dbConnected=false;

function connectDB(){

db = mysql.createConnection({
 host:process.env.DB_HOST,
 user:process.env.DB_USER,
 password:process.env.DB_PASSWORD,
 database:process.env.DB_NAME,
 ssl:{
   rejectUnauthorized:false
 }
});

db.connect(async(err)=>{

if(err){
console.log("❌ Database connection failed");
console.log(err.message);
console.log("⚠️ Server still running without DB");
return;
}

dbConnected=true;
console.log("✅ Database Connected");

createTables();

});

}

connectDB();


// ---------------- TABLES ----------------
function createTables(){

db.query(`
CREATE TABLE IF NOT EXISTS users(
userid INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(50) UNIQUE,
email VARCHAR(100) UNIQUE,
password VARCHAR(255),
role VARCHAR(30) DEFAULT 'staff',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`);

db.query(`
CREATE TABLE IF NOT EXISTS parkingslot(
slotnumber VARCHAR(20) PRIMARY KEY,
slotstatus VARCHAR(20) DEFAULT 'available',
hourlyrate INT DEFAULT 500
)
`);

db.query(`
CREATE TABLE IF NOT EXISTS car(
platenumber VARCHAR(30) PRIMARY KEY,
drivername VARCHAR(100),
phonenumber VARCHAR(20)
)
`);

db.query(`
CREATE TABLE IF NOT EXISTS parkingrecord(
recordid INT AUTO_INCREMENT PRIMARY KEY,
platenumber VARCHAR(30),
slotnumber VARCHAR(20),
entrytime DATETIME,
exittime DATETIME,
duration DECIMAL(10,2),
status VARCHAR(30) DEFAULT 'active'
)
`);

db.query(`
CREATE TABLE IF NOT EXISTS payment(
paymentid INT AUTO_INCREMENT PRIMARY KEY,
recordid INT,
platenumber VARCHAR(30),
amountpaid DECIMAL(10,2),
paymentdate DATETIME
)
`);

const slots=["A1","A2","A3","A4","B1","B2"];

slots.forEach(slot=>{
db.query(`
INSERT IGNORE INTO parkingslot(slotnumber)
VALUES(?)
`,[slot]);
});

createAdmin();

}


async function createAdmin(){

db.query(
"SELECT * FROM users WHERE username='admin'",
async(err,result)=>{

if(result && result.length===0){

let hash=await bcrypt.hash("Admin@123",10);

db.query(`
INSERT INTO users(username,email,password,role)
VALUES(?,?,?,?)
`,
[
"admin",
"admin@gmail.com",
hash,
"admin"
]);

console.log("✅ Admin Created");
}

});

}



// ---------------- HEALTH ----------------
app.get("/",(req,res)=>{
res.json({
message:"SmartPark API Running",
database:dbConnected
});
});

app.get("/api/health",(req,res)=>{
res.json({
status:"OK",
db:dbConnected
});
});


// ---------------- REGISTER ----------------
app.post("/api/register", async(req,res)=>{

if(!dbConnected)
return res.status(500).json({
error:"Database offline"
});

const {
username,
email,
password
}=req.body;

let hash=await bcrypt.hash(password,10);

db.query(
`INSERT INTO users(username,email,password)
VALUES(?,?,?)`,
[username,email,hash],
(err)=>{

if(err)
return res.status(500).json(err);

res.json({
success:true
});

});

});



// ---------------- LOGIN ----------------
app.post("/api/login",(req,res)=>{

if(!dbConnected)
return res.status(500).json({
error:"Database offline"
});

const{
username,
password
}=req.body;

db.query(
`SELECT * FROM users
WHERE username=? OR email=?`,
[username,username],

async(err,rows)=>{

if(rows.length===0){
return res.status(401).json({
error:"Invalid credentials"
});
}

let user=rows[0];

let ok=await bcrypt.compare(
password,
user.password
);

if(!ok){
return res.status(401).json({
error:"Wrong password"
});
}

req.session.user={
id:user.userid,
username:user.username,
role:user.role
};

res.json({
success:true,
user:req.session.user
});

});

});



// ---------------- PARKING SLOTS ----------------
app.get("/api/parkingslots",(req,res)=>{

if(!dbConnected)
return res.json([]);

db.query(
"SELECT * FROM parkingslot",
(err,rows)=>{
res.json(rows||[]);
});

});



// ---------------- ENTRY ----------------
app.post("/api/parkingrecords/entry",(req,res)=>{

if(!dbConnected)
return res.status(500).json({
error:"DB offline"
});

const{
platenumber,
drivername,
phonenumber,
slotnumber
}=req.body;


db.query(
`INSERT IGNORE INTO car
VALUES(?,?,?)`,
[
platenumber,
drivername,
phonenumber
]
);

db.query(
`INSERT INTO parkingrecord
(platenumber,slotnumber,entrytime)
VALUES(?,?,NOW())`,
[
platenumber,
slotnumber
]
);

db.query(
`UPDATE parkingslot
SET slotstatus='occupied'
WHERE slotnumber=?`,
[slotnumber]
);

res.json({
success:true
});

});




// ---------------- EXIT + PAYMENT ----------------
app.put("/api/parkingrecords/exit/:id",
(req,res)=>{

const id=req.params.id;

db.query(
`SELECT * FROM parkingrecord
WHERE recordid=?`,
[id],

(err,row)=>{

if(!row.length)
return res.status(404).json({
error:"Not found"
});

let rec=row[0];

let hours=1;
let amount=hours*500;

db.query(`
UPDATE parkingrecord
SET exittime=NOW(),
duration=?,
status='completed'
WHERE recordid=?
`,
[hours,id]);

db.query(`
INSERT INTO payment
(recordid,platenumber,amountpaid,paymentdate)
VALUES(?,?,?,NOW())
`,
[
id,
rec.platenumber,
amount
]);

db.query(`
UPDATE parkingslot
SET slotstatus='available'
WHERE slotnumber=?
`,
[rec.slotnumber]);

res.json({
success:true,
amount
});

});

});




// ---------------- PAYMENTS ----------------
app.get("/api/payments",(req,res)=>{

db.query(
"SELECT * FROM payment",
(err,rows)=>{
res.json(rows||[]);
});

});




// ---------------- DASHBOARD ----------------
app.get("/api/dashboard/stats",
(req,res)=>{

if(!dbConnected){
return res.json({
slots:0,
cars:0,
revenue:0
});
}

res.json({
message:"Dashboard ready"
});

});




// ---------------- START ----------------
app.listen(PORT,()=>{

console.log("================================");
console.log("🚀 Server running on port",PORT);
console.log("================================");

});