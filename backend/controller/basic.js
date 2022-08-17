module.exports = {
    getHome:  function(req, res, next){
        return res.render('../views/basic/home')
    },

    getCovid: function(req,res,next){
        return res.render('../views/Covid/covid')
    },
}