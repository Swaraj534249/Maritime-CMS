const mongoose=require("mongoose")
const {Schema}=mongoose

const crewingAgentSchema= new Schema({
    agentName: { type: String, },
    shortName: { type: String, },
    address: { type: String, },
    contactPerson: {
      title: { type: String, },
      name: { type: String, },
    },
    country: { type: String, },
    contactNumber: { type: String, },
    email: { type: String, },
    isDeleted:{
        type:Boolean,
        default:false
    }
},{timestamps:true,versionKey:false})

module.exports=mongoose.model('CrewingAgent',crewingAgentSchema)