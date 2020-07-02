var express = require('express');
var jwt = require('jsonwebtoken');
var bcrypt=require('bcryptjs')
var path=require('path');
var mysql=require('mysql');
var router = express.Router();
var cookieParser=require('cookie-parser');
require('dotenv').config();

var app=express();

var db=mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'',
  database:'authentication'
});

db.connect(function(err){
  if(err) throw err;
  console.log('database connected successfully');
  });

router.use(express.static(__dirname+"public/"));

router.use(express.urlencoded({extended:false}));

router.use(express.json());
router.use(cookieParser());

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("page show");
  res.render('index', { title: 'Field Trial Software',msg:'' });
});

router.post('/', function(req, res, next) {
 try {
    const {email,password}=req.body;
    if(!email || !password){
      return res.status(200).render('index', { title: 'Field Trial software',msg:'Please provider an email and password' });
    }
    db.query('SELECT * FROM signup WHERE email=?',[email], async(error,results)=>{
      console.log("query",results);
      if( !results || !(await bcrypt.compare(password,results[0].password))){
        console.log("error")
        return res.status(400).render('index', { title: 'Field Trial software',msg:'Email or password incorrect' });
      } else {
          const id = results[0].id;
          console.log("id",id);
          const token = jwt.sign({id:id},process.env.JWT_SECRET,{ expiresIn: process.env.JWT_EXPIRES_IN });
          // const token = jwt.sign({ data: 'foobar'}, 'secret', { expiresIn: '1h' });
          
          console.log("The token is: "+token);

          const cookieOptions = {
            expires: new Date(
              Date.now() + process.env.JWT_COOKIE_EXPIRES*24*60*60
            ),
            httpOnly: true
          }
          res.cookie('jwt',token,cookieOptions);
          res.status(200).redirect('table');
      }
    })
 }
 catch(error){
    console.log(error);
 } 
});  

router.get('/signup', function(req, res, next) {
  console.log("signup");
  res.render('signup', { title: 'Field Trial Software',msg:'' });
});


router.post('/signup', function(req, res, next) {
console.log(req.body);

const{uname,email,password,confpassword}=req.body;

db.query('SELECT email from signup WHERE email=?',[email],(error,results)=>{
  if(error){
    console.log(error);
  }
  if(results.length>0){
    return res.render('signup',{title: 'Field Trial software',msg:'That email is already in use'})
  } else if(password !== confpassword){
    return res.render('signup', { title: 'Field Trial software',msg:'Password not matched' }); 
  }
  var hashedPassword=bcrypt.hashSync(password,10);
  console.log(hashedPassword);

  db.query('INSERT INTO signup SET?',{uname:uname,email:email,password:hashedPassword},(error,results)=>{
  if(error){
    console.log(error);
  }else {
    console.log(results);
    return res.render('signup', { title: 'Field Trial software',msg:'User Registration Successfull' }); 
  }
  })
})
});


router.get('/dashboard', function(req, res, next) {
  res.render('dashboard', { title: 'Field Trial Software',msg:'' });
});



router.get('/table',function(req, res, next) {
  var getQuery="select * from `information`";
  db.query(getQuery,function(err,result){
 
     if(err) throw err;
 
     res.render('table', { title: 'Farmers Information', records:result,success:'' });
  
  });
 
 });
 
 
 
 router.post('/table', function(req, res, next) {
 
 
   
     var name= req.body.name;
     var fname= req.body.fname;
     var mnum= req.body.mnum;
    var tland= req.body.tland;
    var crobi= req.body.crobi;
    var ckharif_1= req.body.ckharif_1;
    var ckharif_2= req.body.ckharif_2;
    var irrigation= req.body.irrigation;
    var groups= req.body.groups;
    
  
    var insertQuery='insert into `information` (`name`,`fname`,`mnum`,`tland`,`crobi`,`ckharif_1`,`ckharif_2`,`irrigation`,`groups`) VALUES (?,?,?,?,?,?,?,?,?)';
   var query=mysql.format(insertQuery,[name,fname,mnum,tland,crobi,ckharif_1,ckharif_2,irrigation,groups]);
   db.query(query,function(err,response){
       if(err) throw err;
      // console.log(response.insertId);
      var getQuery="select * from `information`";
  db.query(getQuery,function(err,result){
 
     if(err) throw err;
     res.render('table', { title: 'Farmers Information for a certain field', records:result,success:'Record Inserted Successfully' });
  
   });
 });
 });
 
 router.get('/edit/:id', function(req, res, next) {
 var id=req.params.id;
 
 var getQuery="select * from `information` where `id`=?";
 var query=mysql.format(getQuery,id);
  db.query(query,function(err,result){
      if(err) throw err;
      var string=JSON.stringify(result);
         var json =  JSON.parse(string);
        
 res.render('edit', { title: 'Farmers Information for a certain field', records:json,success:'' });
  
 });
 });
 
 router.post('/update/', function(req, res, next) {
 
 
   var id= req.body.id;
   var name= req.body.name;
   var fname= req.body.fname;
   var mnum= req.body.mnum;
  var tland= req.body.tland;
  var crobi= req.body.crobi;
  var ckharif_1= req.body.ckharif_1;
  var ckharif_2= req.body.ckharif_2;
  var irrigation= req.body.irrigation;
  var groups= req.body.groups;
  
    var updateQuery='UPDATE `information` SET `name`=? ,`fname`=? ,`mnum`=? ,`tland`=? ,`crobi`=? ,`ckharif_1`=? ,`ckharif_2`=? ,`irrigation`=? ,`groups`=? , where `id`=?';
     var query=mysql.format(updateQuery,[name,fname,mnum,tland,crobi,ckharif_1,ckharif_2,irrigation,groups,id]);
   db.query(query,function(err,response){
       if(err) throw err;
      // console.log(response.insertId);
   res.redirect('table');
 });
 });
 
 router.get('/delete/:id', function(req, res, next) {
     var id=req.params.id;
 
     var deleteQuery="delete from `information` where `id`=?";
     var query=mysql.format(deleteQuery,id);
      db.query(query,function(err){
 
          if(err) throw err;
  res.redirect('table');
     });
     
 });

module.exports = router;
