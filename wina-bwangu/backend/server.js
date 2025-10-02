const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Load transactions data
let transactions = JSON.parse(fs.readFileSync(__dirname + '/data/transactions.json', 'utf8'));

// Mobile booth data
const booths = [
    { id: 'Wina1', location: 'Lusaka CPD', services: ['Airtel Money','MTN Money','Zamtel Money','Zanaco','FNB'] },
    { id: 'Wina2', location: 'Libala', services: ['Airtel Money','MTN Money','Zamtel Money','FNB'] },
    { id: 'Wina3', location: 'Kabwata', services: ['Airtel Money','MTN Money','Zamtel Money','Zanaco','FNB'] },
    { id: 'Wina4', location: 'Mandevu', services: ['Airtel Money','MTN Money','Zamtel Money'] },
    { id: 'Wina5', location: 'Woodlands', services: ['Airtel Money','MTN Money','Zanaco','FNB'] },
    { id: 'Wina6', location: 'Matero East', services: ['Airtel Money','MTN Money','Zamtel Money'] }
];

// Service revenue data
const serviceRevenue = {
    "Airtel Money": 0.05,
    "MTN Money": 0.06,
    "Zamtel Money": 0.045,
    "Zanaco": 0.035,
    "FNB": 0.04
};

// API to get booths
app.get('/api/booths', (req, res) => {
    res.json(booths);
});

// API to get services for a booth
app.get('/api/services/:boothId', (req, res) => {
    const booth = booths.find(b => b.id === req.params.boothId);
    if(!booth) return res.status(404).json({error: 'Booth not found'});
    const services = booth.services.map(s => ({name: s, revenue: serviceRevenue[s]}));
    res.json(services);
});

// API to get transactions
app.get('/api/transactions', (req,res)=>{
    res.json(transactions);
});

// API to add transaction
app.post('/api/transactions', (req,res)=>{
    const { boothId, service, amount } = req.body;
    const booth = booths.find(b => b.id === boothId);
    if(!booth) return res.status(400).json({error:'Invalid booth'});
    if(!booth.services.includes(service)) return res.status(400).json({error:'Service not offered at this booth'});

    const idNumber = transactions.length + 1;
    const transactionID = `WB${idNumber.toString().padStart(7,'0')}`;
    const revenuePerKwacha = serviceRevenue[service];
    const revenue = amount * revenuePerKwacha;
    
    const transaction = {
        TransactionID: transactionID,
        MobileBooth: boothId,
        Location: booth.location,
        Service: service,
        RevenuePerKwacha: revenuePerKwacha,
        Amount: amount,
        Revenue: revenue
    };
    
    transactions.push(transaction);
    fs.writeFileSync(__dirname + '/data/transactions.json', JSON.stringify(transactions, null, 2));
    res.json(transaction);
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
