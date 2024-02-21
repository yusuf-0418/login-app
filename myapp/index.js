const express=require("express");
const app=express()
const cors=require("cors")
app.use(express.json())
app.use(cors())

const path=require("path");
const { open }=require("sqlite");
const sqlite3=require("sqlite3");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken")

const dbPath=path.join(__dirname,"user.db");

let db=null;

const connectDatabaseAndServer=async ()=>{
    try{
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database
        })

        app.listen(3000,()=>{
            console.log('Server is Running On 3000 PORT');
        })

    }catch(e){
        console.log(`DB Error : ${e.message}`);
        process.exit(1)
    }
}

connectDatabaseAndServer();



// POST USER
app.post("/register",async (request,response)=>{

    const {fullName,phoneNumber,email,password,companyName,agencyMember}=request.body;

    const getDbUser=`SELECT * FROM users WHERE email= '${email}';`;

    const dbUser=await db.get(getDbUser);

    if(dbUser===undefined){
        const hashedPassword=await bcrypt.hash(password,10);
        const registerUserQuery=`INSERT INTO users(full_name,phone_number,email,password,company_name,agency_member)
        VALUES
        (
            '${fullName}',
            ${phoneNumber},
            '${email}',
            '${hashedPassword}',
            '${companyName}',
            ${agencyMember}
        )`;
        await db.run(registerUserQuery);
        response.send("User Created Successfully ");

    }else{
        response.status(400);
        response.send("Email Already Exit")
    }
})


// LOGIN 

//LOGIN

app.post("/login",async(request,response)=>{
    const { email,password}=request.body;
    const dbUserQuery=`SELECT * FROM users WHERE email='${email}'`;
    const dbUser=await db.get(dbUserQuery);
    console.log(dbUser)

    if(dbUser===undefined){
        response.status(400);
        response.send("Invalid User");
    }else{
        const isPasswordMatch=await bcrypt.compare(password,dbUser.password);
        console.log(isPasswordMatch)
        if(isPasswordMatch===true){
            response.status(200);
            let payload={username:dbUser.fullName}
            const jwtToken=jwt.sign(payload,"jwt_token");
            response.send({jwtToken})
            console.log(jwtToken)
            
        }else{
            response.status(400);
            response.send("Invalid Password");
        }
    }
})

// ALL users
app.get("/users",async(request,response)=>{
    const allUsersQuery=`SELECT * FROM users`;
    const users=await db.all(allUsersQuery);
    response.status(200);
    response.send(users);
})