const User=require("../models/User")

exports.getAll = async (req, res) => {
    try {
        const filter={}
        let skip=0
        let limit=100

        if(req.query.user){
            filter['isDeleted']=false
        }

        if(req.query.page && req.query.limit){

            const pageSize=req.query.limit
            const page=req.query.page

            skip=pageSize*(page-1)
            limit=pageSize
        }

        const totalDocs=await User.find(filter).countDocuments().exec()
        const results=await User.find(filter).skip(skip).limit(limit).exec()

        console.log("results", results, totalDocs);
        

        res.set("X-Total-Count",totalDocs)

        res.status(200).json(results)
    
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error fetching Users, please try again later'})
    }
};
exports.getById=async(req,res)=>{
    try {
        const {id}=req.params
        const result=(await User.findById(id)).toObject()
        delete result.password
        res.status(200).json(result)
        
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error getting your details, please try again later'})
    }
}
exports.updateById=async(req,res)=>{
    try {
        const {id}=req.params
        const updated=(await User.findByIdAndUpdate(id,req.body,{new:true})).toObject()
        delete updated.password
        res.status(200).json(updated)

    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error getting your details, please try again later'})
    }
}