const mongoose = require('mongoose');

module.exports = {
    connect : async function(user, password, document) {
        const connString = `mongodb+srv://${user}:${password}@cluster0.g54er.mongodb.net/${document}?retryWrites=true&w=majority`
        //const connString = 'mongodb+srv://pedro:mclaren2018@cluster0.g54er.mongodb.net/estufas?retryWrites=true&w=majority';
        await mongoose.connect(connString, {useNewUrlParser: true, useUnifiedTopology : true});
        console.log('MongoDB conectado com sucesso!');
        //Get the default connection
        let db = mongoose.connection;

        //Bind connection to error event (to get notification of connection errors)
        db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    }
    
}

