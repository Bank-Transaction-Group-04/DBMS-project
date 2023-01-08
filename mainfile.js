const express= require('express');
const con=require('./a1');
const path= require('path');
const app = express();
const publicpath=path.join(__dirname,'my')
const bodyParser = require('body-parser');
app.use(express.static(publicpath))
app.use(bodyParser.urlencoded({ extended: true }));
const pug=require('pug');
app.set('view engine','pug');
app.post('/submit-form', function (req, res) {
  
   const Uname = req.body.username;
  console.log(Uname);
   const pwd = req.body.password;
  console.log(pwd);
  con.query('select ACCOUNT_NUMBER,BALANCE from SAVING_ACCOUNT where USER_NAME=? and PASSWORD=?',[Uname,pwd],(err,result)=>{
    if (err) throw err;
    
    console.log(result[0].ACCOUNT_NUMBER);
    global.acc_num=result[0].ACCOUNT_NUMBER;
    console.log(result[0].BALANCE);
    global.balance=parseFloat(result[0].BALANCE);
    res.redirect('\activities.html');
    
  })
});
  // do something with the form data
  app.post('/acc_details', function (req, res) {
    // Prepare output in JSON format
   res.render('showaccDetails.pug',{accnum:global.acc_num,balance:global.balance});
      
    })
 app.post('/transaction',function(req,res){
  res.redirect('\Withdrawal.html');
 })   
 app.post('/transac_process',function(req,res){
  const to=req.body.Account_Number;
  const amnt=parseFloat(req.body.Amount);
  const blnc=global.balance;
  con.beginTransaction(function(err) {
    if (err) { throw err; }
    console.log(blnc-amnt);
    if(global.balance-amnt<0){res.redirect('/InsufficientMoney.html')}
    con.query('SELECT DATE FROM WITHDRAWAL WHERE ACCOUNT_NUMBER=? ORDER BY DATE DESC',[global.acc_num],function(error,resul){
      if (error) { throw error; }
      if (resul.length==0){global.latestDate=0000-00-00}
      else{global.latestDate=resul[0].DATE;} 
      con.query('SELECT WITHDRAWAL_COUNT_PER_MONTH FROM SAVING_ACCOUNT WHERE ACCOUNT_NUMBER=?',[global.acc_num],function(error,results){
        if (error) { throw error; }
        const count=results[0].WITHDRAWAL_COUNT_PER_MONTH;
        console.log("haai kohim");
        // compare the current date to a date that is one month later
        con.query('SELECT DATE_SUB(NOW(), INTERVAL 1 MONTH) ',function(error,results){
          if (error) { throw error; }
          if(results>global.latestDate){
            con.query('UPDATE SAVING_ACCOUNT SET WITHDRAWAL_COUNT_PER_MONTH=? WHERE ACCOUNT_NUMBER=?',[count+1,global.acc_num],function(error,results){
              if (error) {
                return con.rollback(function() {
                  throw error;
                });
              }
            });
         }
          else if(results<global.latestDate){
            console.log("aawaa mm mehe")
            con.query('UPDATE SAVING_ACCOUNT SET WITHDRAWAL_COUNT_PER_MONTH=? WHERE ACCOUNT_NUMBER=?',[count+1,global.acc_num],function(error,results){
              if (error) {
                return con.rollback(function() {
                  throw error;
                });
              }
              
           });
          }
          else{res.redirect('/exeed with_cnt_per_mnt.html')}
          let s=global.balance+amnt
          console.log(typeof (global.balance-amnt));
          console.log(typeof amnt);
          console.log(typeof s);
          const t=8000;
          con.query('UPDATE SAVING_ACCOUNT SET BALANCE=? WHERE ACCOUNT_NUMBER=?', [20000,global.acc_num], function(error, results, fields) {
            if (error) {
              return con.rollback(function() {
                throw error;
              });
            }
        
            con.query('UPDATE SAVING_ACCOUNT SET BALANCE=? WHERE ACCOUNT_NUMBER=?', [12000,to], function(error, results, fields) {
              if (error) {
                return con.rollback(function() {
                  throw error;
                });
              }
              con.commit(function(error) {
                if (error) {
                  return con.rollback(function() {
                    throw error;
                  });
                }
                console.log('Transaction complete.');
      
              });
      
            });
          });
        })
      });
    });
  
  });
}) 


app.listen("8080");