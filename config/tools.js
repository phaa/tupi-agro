module.exports = {
    timeStringToDatabase: function (hourString) {
        return hourString.substring(0, 2) * 3600 + hourString.substring(3, 5) * 60 + hourString.substring(6,8);
    },
    databaseTimeToString: function (databaseTime) {
        let hours = storedTime / 3600;  // needs to be an integer division
        let leaves = storedTime - hours * 3600;
        let minutes = leaves / 60;
        let seconds = leaves - 60 * minutes;
        return `${hours}:${minutes}:${seconds}`;
    }
}