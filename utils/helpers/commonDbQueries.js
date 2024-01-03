import { model } from "mongoose";

const findRecordById = async( model , id , err_msg , status_code = 404 )=>{
    const record = await model.findById( id );

    if(!record){
        throw {
            success: false,
            status: status_code,
            message: err_msg,
        }
    }

    return record;
}


const createRecord = async( model ,  obj_body )=>{
    const newRecord = new model({...obj_body});
    await newRecord.save();
    return newRecord;
}


const updateRecord = async( model , id , update_body )=>{
    let filter = {
        _id: id
    }

    const toBeupdatedRecord = await model.findOneAndUpdate( filter, update_body , { new: true });
    return toBeupdatedRecord;
}   

export {
    createRecord,
    updateRecord,
    findRecordById,
}