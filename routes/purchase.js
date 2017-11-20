
//import { config } from 'chai/lib/chai';

var express = require('express');


var config = require('../config');
var router = express.Router();
const StockUpdater = require('../services/supplierStockUpdater.js');
const request = require('request');
const orderFulfilUpdater = require('../services/stockRequiredToFulfilOrderUpdater.js');
const productSearcher = require('../services/productSearchService.js');
const purchaseDTO = require('../dto/purchaseOrderProductDTO');


/**
 * Gets a list of all the product avaliable for purchase with the suppliers that have them in stock
 */
router.get('/',function(req, res,next){
    productSearcher.getAllProductsAvaliableForPurchase().then(function(product){
        res.render('viewProducts.pug', {productList : product});
    });
});

router.post('/test', function(req,res,next){
    console.log(req.body);
});

router.post('/test/:id', function(req,res,next){
    console.log(req.body);
});

function updateAdminWithPurchase(item){
 //here we are posting to the admin service with the details to make the order 
 try{
 request.post({
    url : config.AdminServicePurchaseURL,
    body: item.jsonVersion,
    json: true
});} catch(err){
    console.log('error with admin service link');
}
}


function updateStockWithPurchase(ean, number){
    console.log(ean, number);

    productSearcher.readyItemForStockUpdate(ean, number).then(function(item){
        request.post({
            url : config.stockServiceUpdaterURL,
            body: item.jsonVersion,
            json: true
        });
   

})}

/**
 * Once submit order has been pressed, the stock required is updated and the order sent to admin and stock services
 */
router.post('/submitOrder', function(req,res,next){
    console.log(req.body);
    for (var propName in req.body) {
        if (req.body.hasOwnProperty(propName)) {
            if (req.body[propName][1] != '' && parseInt(req.body[propName][1]) > 0 && req.body[propName][2] != 'Select Supplier' ) {
                var purchaseItem = new purchaseDTO (req.body[propName][0],req.body[propName][1],propName,req.body[propName][2]);
                orderFulfilUpdater.updateStockRequiredAfterOrderPlaced(purchaseItem.ean, purchaseItem.numberRequired);
                updateAdminWithPurchase(purchaseItem);
                updateStockWithPurchase(propName, req.body[propName][1]);
            }
        }
    }
    res.send('order sucessful page .... I need to be done, in good news, the post was successful');
});


/**
 * This method updates the supplier stock details with any recent changes (such as price update)
 */
router.get('/updateSupplierStockDetails', function(req,res,next){
    StockUpdater.updateDbWithAllSupplierStockDetails();
    res.send('complete');
});

/**
 * This method responds a request from the order service when certain items are required to fulfil an order
 */
router.post('/stockRequired', function(req,res,next){
    var items = req.body["itemsRequired"];
    for(var item in items){
        orderFulfilUpdater.addStockRequiredToProduct(req.body["orderid"], items[item]["ean"], items[item]["number"]);
    }
   res.send(req.body);
})

module.exports = router;