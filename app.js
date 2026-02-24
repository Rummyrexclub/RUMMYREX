app.post('/api/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await User.findOne({ phone: phone, password: password });
        if (user) {
            // Login success ayithe ikkade coins and name confirm chesthunnam
            res.json({ success: true, name: user.name, coins: user.coins });
        } else {
            res.json({ success: false, message: "Invalid Details! Check Admin." });
        }
    } catch (e) { res.json({ success: false }); }
});
