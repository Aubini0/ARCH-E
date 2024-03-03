import { model } from "mongoose";

const findRecordById = async( model , id , err_msg , status_code = 404  )=>{
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


const findRecord = async( model , query_obj , err_msg , status_code = 404 )=>{
    const record = await model.find({ ...query_obj })

    if(record.length == 0){
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



const fetchPaginatedRecords = async( model , query_obj , sorted_criteria ,  page , limit , populate_criteria )=>{
    
    const paginatedRecords = await model.find({ ...query_obj })
        .sort({ ...sorted_criteria }) // Sort by most recent
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate({ ...populate_criteria })
        .exec();

    return paginatedRecords
}


const getRecordsCount = async( model , query_obj  , limit)=>{
    let totalCount = await model.countDocuments({ ...query_obj });
    totalCount = Math.round(totalCount / parseInt(limit))
    totalCount = totalCount == 0 ? 1 : totalCount
    return totalCount;
}


const deleteRecord = async(model , id)=>{
    let deletedResponce = await model.findByIdAndDelete(id);
    return deletedResponce;

}

export {
    findRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    findRecordById,
    getRecordsCount,
    fetchPaginatedRecords
}