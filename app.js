const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch(err => console.log(err));

const User = mongoose.model('User', new mongoose.Schema({
    name: String, phone: String, password: String, coins: { type: Number, default: 100 }
}));

app.post('/api/signup', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

app.listen(process.env.PORT || 3000);
