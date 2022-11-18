var express = require('express');
var router = express.Router();
var Client = require('../modals/clients');
var Product = require('../modals/products');
var Transport = require('../modals/transport');
var Bill = require('../modals/bills');
var ejs = require('ejs');
const { ToWords } = require('to-words');

const toWords = new ToWords();

var fs = require('fs');

// var pdf = require("pdf-creator-node");
const puppeteer = require('puppeteer')
var fs = require("fs");
const products = require('../modals/products');
const bills = require('../modals/bills');


/* GET home page. */
router.get('/', function(req, res, next) {
  Bill.find(function(err,bills){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    Client.find(function(err,clients){
      if(err){
        console.log(err);
        return res.redirect('/');
      }
      res.render('index', { title: 'Home | Poomani Fireworks', bills:bills, clients:clients});
    })
    
  }).sort({invoiceNumber:-1});
  
});

router.get('/newBill', function(req, res, next) {

  Client.find(function(err,result){
    if(err){
      console.log(err);
      return res.render('/');
    }
    Product.find(function(err,result1){
      if(err){
        console.log(err);
        return res.render('/');
      }
      Transport.find(function(err,transport){
        if(err){
          console.log(err);
          return res.render('/');
        }
        res.render('newBill', { title: 'New Bill | Poomani Fireworks', parties:result, products:result1, transports:transport });
      })
      
    })
    
  })
  
});

router.post('/newBillValues', function(req,res,next){


  var tempInvoiceNumber = req.body.invoiceNo;
  var invoiceNumber;
  var invoiceDate = req.body.invoiceDate;
  var cusId = req.body.partyName;
  
  const {caseNo} = req.body;
  var caseNums = [];
  caseNums = caseNo;
  
  const {itemName} = req.body;
  var itemNames = [];
  itemNames = itemName;

  const {itemQty} = req.body;
  var itemQtys = [];
  itemQtys = itemQty;

  const {itemRate} = req.body;
  var itemRates = [];
  itemRates = itemRate;

  const {itemPer} = req.body;
  var itemPers = [];
  itemPers = itemPer;

  var cartItems = []
  var totalItems = 0;
  var netBillValue = 0;
  var igst = 0;
  var cgst = 0;
  var sgst = 0;
  var totalBillValue = 0;

  for(i=0; i<itemNames.length;i++){
    if(itemQtys[i]>0){
      cartItems.push(
        {
          caseNum:caseNums[i], 
          name:itemNames[i],
          quantity:itemQtys[i],
          Rate:itemRates[i],
          per:itemPers[i],
          subTotal: itemQty[i]*itemRates[i]
        }
        )
    }
  }

  cartItems.forEach(item=>{
    totalItems += Number(item.quantity);
    netBillValue += Number(item.subTotal);
  })

  console.log(cartItems, cusId, totalItems, req.body.transport, netBillValue);

  Client.findById(cusId, function(err,resultt){
    if(err){
      console.log(err);
      return res.render('newBill');
    }
    if(resultt.gstType === "Central"){
      igst = netBillValue * 0.18;
      totalBillValue = igst + netBillValue;
      invoiceNumber = "C - " + tempInvoiceNumber;
    }
    else if(resultt.gstType === "State"){
      cgst = netBillValue * 0.09;
      sgst = netBillValue * 0.09;
      totalBillValue = cgst + sgst + netBillValue;
      invoiceNumber = "S - " + tempInvoiceNumber;
    }

    console.log('CGST : ' + cgst);
    console.log('SGST : ' + sgst);
    console.log('IGST : ' + igst);
    console.log('TotalBillValue : ' + totalBillValue);
    console.log(toWords.convert(totalBillValue, { currency: true }));

    var bill = new Bill({
      invoiceNumber:invoiceNumber,
      billDate:invoiceDate,
      party:resultt.name,
      address1:resultt.address1,
      address2:resultt.address2,
      city:resultt.city,
      state:resultt.state,
      gstNo:resultt.gstNo,
      gstType:resultt.gstType,
      panAadhar:resultt.panAadhar,
      transport:req.body.transport,
      billItems:cartItems,
      billAmount:netBillValue.toFixed(2),
      cgst:cgst.toFixed(2),
      sgst:sgst.toFixed(2),
      igst:igst.toFixed(2),
      totalBillValue: Math.round(totalBillValue),
      amountInWords:toWords.convert(totalBillValue, { currency: true })
    })

    bill.save(function(err,result){
      if(err){
        console.log(err);
        return res.render('newBill');
      }
      res.redirect('/');
    })

  })
  
})

router.get('/deleteBill/:id', function(req,res,next){
  var id = req.params.id;
  Bill.deleteOne({_id:id}, function(err,delRes){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    res.redirect('/');
  })
})

router.get('/newParty', function(req,res,next){
  res.render('newParty', {title:'New Party | Poomani Fireworks'});
})

router.post('/addNewParty', function(req,res,next){

  var client = new Client({
    name:req.body.partyName,
    address1:req.body.partyAdd1,
    address2:req.body.partyAdd2,
    city:req.body.partyCity,
    state:req.body.partyState,
    gstNo:req.body.partyGST,
    panAadhar:req.body.partyPAN,
    gstType:req.body.gstType    
  })
  client.save(function(err,result){
    if(err){
      console.log(err);
      return res.render('newParty');
    }
    res.redirect('/newParty');
  })

})

router.post('/updateParty/:id', function(req,res,next){
  var id = req.params.id;
  Client.findByIdAndUpdate(
    {_id:id},
    {$set:{
      name:req.body.partyName,
      address1:req.body.address1,
      address2:req.body.address2,
      city:req.body.city,
      state:req.body.state,
      gstNo:req.body.gstNo,
      panAadhar:req.body.panAadhar
    }}, 
    function(err,result){
      if(err){
        console.log(err);
        return res.redirect('/');
      }
      res.redirect('/');
    }
    )
})

router.get('/deleteClient/:id', function(req,res,next){
  var id = req.params.id;
  Client.deleteOne({_id:id}, function(err,result){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    res.redirect('/');
  })
})

router.get('/newProduct', function(req,res,next){
  products.find(function(err,result){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    res.render('newProduct', {title:'New Product | Poomani Fireworks',products:result});
  })
  
})

router.post('/addNewProduct', function(req,res,next){

  var product = new Product({
    name:req.body.productName,
    rate:req.body.productRate,
    per:req.body.productPer,
  })
  product.save(function(err,result){
    if(err){
      console.log(err);
      return res.render('newProduct');
    }
    res.redirect('/newProduct');
  })

})

router.post('/updateProduct/:id', function(req,res,next){
  var id = req.params.id;
  Product.findByIdAndUpdate(
    {_id:id},
    {$set:{
      name:req.body.productName,
      rate:req.body.productRate,
      per:req.body.per,
    }}, 
    function(err,result){
      if(err){
        console.log(err);
        return res.redirect('/');
      }
      res.redirect('/newProduct');
    }
    )
})

router.get('/deleteProduct/:id', function(req,res,next){
  var id = req.params.id;
  Product.deleteOne({_id:id}, function(err,result){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    res.redirect('/newProduct');
  })
})

router.get('/transport', function(req,res,next){
  Transport.find(function(err,transports){
    if(err){
      console.log(err);
      return res.render('transport');
    }
    res.render('transport',{title:'Transport | Poomani Fireworks', transports:transports});
  })
  
})

router.post('/addNewTransport', function(req,res,next){
  var transport = new Transport({
    name:req.body.transportName,
    place:req.body.place,
  })
  transport.save(function(err,result){
    if(err){
      console.log(err);
      return res.render('/');
    }
    res.redirect('/transport');
  })

})

router.get('/printBillOriginal/:id', function(req,res,next){
  
  var id = req.params.id;
  Bill.findById({_id:id}, function(err,result){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
   

    var fileName = './invoices/invoice-' + result.invoiceNumber + '.pdf';

    res.render('invoiceGenerator', {bill:result}, function(err,html){
      
      if(err){
        return console.log(err);
      }

    (async () => {
    
      // launch a new chrome instance
          const browser = await puppeteer.launch({
            headless: true
          })  
  
      // create a new page
         const page = await browser.newPage();
  
      // set your html as the pages content
          
          await page.setContent(html, {
            waitUntil: 'domcontentloaded'
          })
          await page.emulateMediaType('screen');
  
      // create a pdf buffer
          const pdfBuffer = await page.pdf({
            format: 'A4',
            path: fileName,
            printBackground:true
          })

          console.log('done');
          res.header('content-type','application/pdf');
          res.send(pdfBuffer);

      // close the browser
          await browser.close();
  
  })()

})
     

    });
  })

// router.get('/printBillDupe/:id', function(req,res,next){
//     var id = req.params.id;
//     Bill.findById({_id:id}, function(err,result){
//       if(err){
//         console.log(err);
//         return res.redirect('/');
//       }
//       // res.render('invoiceGenerator',{bill:result});
  
//       var fileName = './invoices/invoice-' + result.invoiceNumber + '.pdf';
  
//       res.render('invoiceGeneratorDupe', {bill:result}, function(err,html){
//         if(err){
//           return console.log(err);
//         }
  
//       var document = {
//         html: html,
//         data: {
//           bill: result,
//         },
//         path: fileName,
//         type: "",
//       };
    
//       pdf
//     .create(document, {
//       childProcessOptions: {
//         env: {
//           OPENSSL_CONF: '/dev/null',
//         },
//       }
//     }, options)
//     .then((resul) => {
//            var datafile = fs.readFileSync(fileName);
//            res.header('content-type','application/pdf');
//            res.send(datafile); 
//     })
//     .catch((error) => {
//       console.error(error);
//     });
//   })
       
  
  
        
//       });
//   })

router.get('/sales', function(req,res,next){
  res.render('sales',{title:'Sales | Poomani Fireworks',fromDate:req.body.fromDate, toDate:req.body.toDate, ttv:0, tsgst: 0, tcgst: 0, tigst: 0, tbv: 0})
})

router.post('/getSales', function(req,res,next){
 
  Bill.find({
    billDate:{
      $gte: req.body.fromDate,
      $lt: req.body.toDate
    }
  }, function(err,result){
     var totalTaxableValue = 0;
     var totalSGST = 0;
     var totalCGST = 0;
     var totalIGST = 0;
     var totalBillValue = 0;
     
     result.forEach(bill => {
      totalTaxableValue += bill.billAmount;
      totalSGST += bill.sgst;
      totalCGST += bill.cgst;
      totalIGST += bill.igst;
      totalBillValue += bill.totalBillValue;
     });

     console.log(totalTaxableValue, totalSGST, totalCGST, totalIGST, totalBillValue);
     res.render('sales',{title:'Sales | Poomani Fireworks', fromDate:req.body.fromDate, toDate:req.body.toDate, ttv:totalTaxableValue, tsgst: totalSGST, tcgst: totalCGST, tigst: totalIGST, tbv: totalBillValue})
  })

})
  

module.exports = router;
