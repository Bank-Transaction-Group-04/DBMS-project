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
   const pwd = req.body.password;
  
  con.query('select ACCOUNT_NUMBER,BALANCE,TYPE_ID from SAVING_ACCOUNT where USER_NAME=? and PASSWORD=?',[Uname,pwd],(err,result)=>{
    if (err) throw err;
    if(result.length!=0){
    console.log(result[0].ACCOUNT_NUMBER);
    global.acc_num=result[0].ACCOUNT_NUMBER;
    global.ty_id=result[0].TYPE_ID;
    console.log(result[0].BALANCE);
    global.balance=parseFloat(result[0].BALANCE);
    res.redirect('\activities.html');
    }
else{
  con.query('select ACCOUNT_NUMBER,BALANCE,TYPE_ID from CHECKING_ACCOUNT where USER_NAME=? and PASSWORD=?',[Uname,pwd],(err,result)=>{
    if (err) throw err;
    if(result.length!=0){
    console.log(result[0].ACCOUNT_NUMBER);
    global.acc_num=result[0].ACCOUNT_NUMBER;
    global.ty_id=result[0].TYPE_ID;
    global.balance=parseFloat(result[0].BALANCE);
    res.redirect('\Checking_acc_activities.html');
    }
/*else{
      con.query('select count(*) from EMPLOYEE where USERNAME=? and PASSWORD=?',[Uname,pwd],(err,result)=>{
        if (err) throw err;
        const results = result[0][Object.keys(result[0])[0]]
        if(results!=0){
        res.redirect('\Employee_activities.html');
        }
    else{
      con.query('select count(*) from MANAGER where USERNAME=? and PASSWORD=?',[Uname,pwd],(err,result)=>{
        if (err) throw err;
        const results = result[0][Object.keys(result[0])[0]]
        if(results!=0){
        res.redirect('\Manager_activities.html');
        }
    else{
          res.redirect('\Invalid_usname_pwd.html'); 
        }
         }); 
        
      }); 
    }*/
  });
    } 
});
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
  const ho_name=req.body.name;
  const amnt=parseFloat(req.body.Amount);
  const BRANCH_NAME=req.body.Branch_name;
  con.beginTransaction(function(err) {
    if (err) { throw err; }
    con.execute('SELECT CHECH_WI_P_MONTH(?,?)',[global.ty_id,global.acc_num],function(error, rows) {
      if (error) { throw error;}
      const results = rows[0][Object.keys(rows[0])[0]]; 
      console.log(results);
      if(!results){res.redirect('/exeed_with_cnt_per_mnth.html')}
      else{
  
    con.execute('SELECT check_balance(?,?,?)',[global.ty_id,global.balance,amnt],function(error, rows) {
      if (error) {throw error;}; 
      const results = rows[0][Object.keys(rows[0])[0]]; 
      if(!results){res.redirect('/InsufficientMoney.html')}
      else{
      
    
    con.query('CALL update_transaction_sender_with(?,?,?,?,?)', [global.acc_num,to,global.balance,amnt,BRANCH_NAME], function(error, results) {
      if (error) {
              return con.rollback(function() {
                throw error;
              });
            }
        
            con.query('CALL update_transaction_receiver_depo_with(?,?,?,?,?)', [to,global.acc_num,global.balance,amnt,BRANCH_NAME], function(error, results) {
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
                res.render('successfulTransaction.pug',{amnt:amnt,name:ho_name});
                
              });
              
          
         });
    });
  };
});
      };
});
  });
 
 });
 
 app.post('/ch_transaction',function(req,res){
  res.redirect('\che_withd.html');
 }) 
 app.post('/ch_transac_process',function(req,res){
  
  const to=req.body.Account_Number;
  const ho_name=req.body.name;
  const amnt=parseFloat(req.body.Amount);
  const BRANCH_NAME=req.body.Branch_name;
  console.log(amnt);
  console.log(global.balance);
  console.log(global.ty_id);
  con.beginTransaction(function(err) {
    if (err) { throw err; }
    con.execute('SELECT check_balance(?,?,?)',[global.ty_id,global.balance,amnt],function(error, rows) {
      if (error) {throw error;}; 
      const results = rows[0][Object.keys(rows[0])[0]]; 
      if(!results){res.redirect('/InsufficientMoney.html')}
      else{
        
    
    con.query('CALL update_transaction_sender_with(?,?,?,?,?)', [global.acc_num,to,global.balance,amnt,BRANCH_NAME], function(error, results) {
      if (error) {
              return con.rollback(function() {
                throw error;
              });
            }
            con.query('CALL update_transaction_receiver_depo_with(?,?,?,?,?)', [to,global.acc_num,global.balance,amnt,BRANCH_NAME], function(error, results) {
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
                res.render('successfulTransaction.pug',{amnt:amnt,name:ho_name});
                
              });
               
         });
    });
  };
});
     
  });
 
 });
 app.post('/fixed_deposit_details' ,function(req,res){
 
  con.execute('select CHECH_FD_HAVE(?)',[global.acc_num],function(error, rows) {
    if (error) { throw error;}
    const results = rows[0][Object.keys(rows[0])[0]]; 
    if(!results){res.redirect('/haventFd.html')}
    else{
      con.query('SELECT TIME_PERIOD,AMOUNT,DATE_TIME,INTEREST_RATE FROM FD NATURAL JOIN FD_PLAN WHERE ACCOUNT_NUMBER=?',[global.acc_num],function(error, result) {
        if (error) { throw error;}
        const t_period=result[0].TIME_PERIOD;
        const FD_amount=result[0].AMOUNT;
        const DATE_TIME=result[0].DATE_TIME;
        const in_rate=result[0].INTEREST_RATE;
        res.render('ShowFDDetails.pug',{TIME_PERIOD:t_period,AMOUNT:FD_amount,DATE_TIME:DATE_TIME,INTEREST_RATE:in_rate});
      });
    }
    });
 });
app.post('/online_loan',function(req,res){
 con.execute('select CHECK_CAN_APP_ON_LOAN(?)',[global.acc_num],function(error,rows){
  if (error) { throw error;}
    const results = rows[0][Object.keys(rows[0])[0]]; 
    if(!results){res.redirect('/haventFd.html')}
    else{res.redirect('/loan_application.html')}
 });
});
app.post('/loan_apply_process',function(req,res){
  const amnt=parseFloat(req.body.Amount);
  const T_ID=req.body.Time_period;
  con.execute('select CHECK_REQUIST(?,?)',[global.acc_num,amnt],function(error,rows){
    if (error) { throw error;}
    const results = rows[0][Object.keys(rows[0])[0]]; 
    if(!results){res.redirect('/exceed_loan_limit.html')}
    else{
      con.beginTransaction(function(err) {
        if (err) { throw err; }
      con.query('CALL LOAN_PROCESS(?,?,?)',[global.acc_num,amnt,T_ID],function(error,rows){
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
          console.log('deposit to your account');
          res.render('successfulLoan.pug',{amnt:amnt});
          
        });
         
      });
      });
    }
 });
});

app.post('/display_loan_details',function(req,res){
 con.query('SELECT AMOUNT,DATE_TIME,INTEREST_RATE,PERIOD FROM ONLINE_LOAN NATURAL JOIN LOAN_TYPE WHERE FD_ID=(SELECT FD_ID FROM FD WHERE FD.ACCOUNT_NUMBER= ?) UNION SELECT AMOUNT,DATE_TIME,INTEREST_RATE,PERIOD FROM MANUAL_LOAN ML NATURAL JOIN LOAN_TYPE WHERE ML.ACCOUNT_NUMBER=? ',[global.acc_num,global.acc_num],function(error,result){
  if (error) { throw error;}
  const len=result.length;
  if(len==0){res.redirect('/haventLoan.html')};
   res.render('showLoanDetails.pug',{AMOUNT:result[len-1].AMOUNT,DATE_TIME:result[len-1].DATE_TIME,INTEREST_RATE:result[len-1].INTEREST_RATE,TIME_PERIOD:result[len-1].PERIOD});
  
  
 })
});
app.post('/Manager-Employee-login', function(req,res){

  // geeting userid and password from the request

  const userid= req.body.username;
  const password = req.body.password;
  con.execute('SELECT CHECK_BANK_LOGIN(?,?)',[userid,password],function(err,result){
   
    if (err) throw err;
    const path = result[0][Object.keys(result[0])[0]];
    res.redirect(path);
  });
});

app.post('/manual-personal', function(req,res){

  const name = req.body.name;
  const NIC =req.body.NIC;
  const DOB = req.body.DOB;
  const address = req.body.address;
  const gender = req.body.Gender;
  const profession = req.body.job;
  const monthly_income = parseFloat(req.body.salary);
  const contact = req.body.contact;
  const amount = parseFloat(req.body.amount);
  console.log(amount);
  const type = req.body.Time_period;

  con.beginTransaction(function(err){
    if (err) throw err;

    con.query('CALL INSERT_MANUAL_PERSONAL(?,?,?,?,?,?,?,?,?,?)',[name,NIC,DOB,address,gender,profession,monthly_income,contact,amount,type],function(error){
      if (error){
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
        console.log('request added');
        res.redirect('\waiting_loan.html');    
      });     
    });
  });
});


// manuall-business
app.post('/manual-business', function(req,res){

  const name = req.body.name;
  const Reg =req.body.Reg;
  const address = req.body.address;
  const business = req.body.business;
  const monthly_income = parseFloat(req.body.salary);
  const contact = req.body.contact;
  const amount = parseFloat(req.body.amount);
  console.log(amount);
  const type = req.body.Time_period;

  con.beginTransaction(function(err){
    if (err) throw err;

    con.query('CALL INSERT_MANUAL_BUSSINESS(?,?,?,?,?,?,?,?)',[name,Reg,address,business,monthly_income,contact,amount,type],function(error){
      if (error){
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
        console.log('request added');
        res.redirect('\waiting_loan.html');    
      });     
    });
  });
});
app.post('/transaction_history',function(req,res){
  res.redirect('/select_branch.html')
});
app.post('/transaction_history_process',function(req,res){
  const bn_name=req.body.BRANCH_NAME;
  console.log(bn_name)
con.query('SELECT W_ID,AMOUNT,DATE_TIME,ACCOUNT_NUMBER,DESCRIPT FROM WITHDRAWAL WHERE BRANCH_NAME=?',[bn_name],function(error, rows) {
  if (error) { throw error;}
  console.log(rows.length)
  res.render('showhistory.pug',{bnchname:bn_name,Rows:rows})
});
});
// approving loans by the manager
app.post('/approve',function(req,res){
  res.redirect('/approve.html');

});

// first redirect the exixsting details to the managers view
app.post('/approve-personal',function(req,res){
  con.query('SELECT * FROM APPROVE_PERSONAL',function(err,results){
    if (err) throw err;
    console.log(results.length);
    const apply_id =[];
    const name = [];
    const NIC =[];
    const DOB = [];
    const address = [];
    const gender = [];
    const profession = [];
    const monthly_income = [];
    const contact = [];
    const amount = [];
    const type =[];
    for (let i=0; i<results.length && i<5 ;i++ ){

      apply_id.push(results[i].APPLY_ID);
      name.push(results[i].CUSTOMER_NAME);
      NIC.push(results[i].NIC);
      DOB.push(results[i].DATE_OF_BIRTH);
      address.push(results[i].ADDRESS);
      gender.push(results[i].GENDER);
      profession.push(results[i].PROFESSION);
      monthly_income.push(results[i].MONTHLY_INCOME);
      contact.push(results[i].CONTACT);
      amount.push(results[i].AMOUNT);
      type.push(results[i].LOAN_TYPE_ID);

    }
    console.log(name[0]);
    if(results.length!=0){
    res.render('personalLoanApprove.pug',{apply_id:apply_id,name:name,NIC0:NIC,DOB:DOB,address:address,gender:gender,profession:profession,monthly_income:monthly_income,contact:contact,amount:amount,type:type});
    }
    
  });
  
});

// approved personal loans

app.post('/approved-personal',function(req,res){
  const applyid= req.body.apply_id;

  var installment;
  var amount;
  var type_id;
  con.beginTransaction(function(err){

    if (err) throw err;
    con.query('CALL MARK_CHECKED_PERSONAL(?)',[applyid]);
    console.log('hi');
    con.execute('SELECT LOAN_DETAILS_AMOUNT(?)',[applyid], function(err,result){
      if (err) throw err;
      amount= result[0][Object.keys(result[0])[0]];
      console.log(amount);
    });
    console.log('hi1');
    con.execute('SELECT LOAN_DETAILS_TYPE(?)',[applyid], function(err,result){
      if (err) throw err;
      type_id =  result[0][Object.keys(result[0])[0]];
    });
    console.log('hi2');
    console.log(type_id,amount);
    con.execute('SELECT INSTALLMENT_CALCULATOR(?,?)',[type_id,amount], function(err,result){
      if (err) throw err;
      installment= result[0][Object.keys(result[0])[0]];
      
    });
    console.log('hi3');
    
      
    con.query('CALL INSERT_APPROVED_LOANS(?,?,?,?,?,?)',[amount,installment,'NOT YET',type_id,userid]);
  });
  res.redirect('\manager.html');




  
});

// rejected personal loans
app.post('/reject-personal', function(res,res){
  const applyid= req.body.apply_id;
  con.beginTransaction(function(err){

    if (err) throw err;

    con.query('CALL MARK_CHECKED_PERSONAL(?)',[applyid]);
  });
  res.redirect('\Manager.html');
});
app.listen("8080");