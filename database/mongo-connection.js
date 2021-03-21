const mongoose = require('mongoose');

module.exports = {
    connect : function(user, password, document) {
        const connString = `mongodb+srv://${user}:${password}@cluster0.g54er.mongodb.net/${document}?retryWrites=true&w=majority`
        //const connString = 'mongodb+srv://pedro:mclaren2018@cluster0.g54er.mongodb.net/estufas?retryWrites=true&w=majority';
        mongoose.connect(connString, {useNewUrlParser: true, useUnifiedTopology : true})
        .then(() => console.log('MongoDB conectado com sucesso!'))
        .catch((err) => console.log(err));
    }
    
}

