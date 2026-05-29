const axios = require('axios');
axios.get('https://shyambhog.onrender.com/api/faq')
  .then(res => console.log("DATA:", JSON.stringify(res.data, null, 2)))
  .catch(err => console.error("ERR:", err.message));
