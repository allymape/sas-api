function InsertAuditTrail(user_id, event_type, new_body, api_router, rollId, message){
    db.query('INSERT INTO audit_trail (user_id, event_type, new_body, ' + 
            'created_at, ip_address, api_router, browser_used, rollId, message) ' + 
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [],
        (err, result) => {
        if (err) {
        console.log(err)
        return res.status(400).send({
        error: true,
        statusCode: 400,
        message: err
        });
        }
        return res.status(200).send({
        error:false,
        statusCode: 300,
        message: 'The user has been registerd with us!'
        });
        }
    );
}

function UpdateAuditTrail(user_id, event_type){
    db.query('INSERT INTO audit_trail (user_id, event_type, old_body, new_body, ' + 
            'created_at, ip_address, api_router, browser_used, rollId, message) ' + 
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [],
        (err, result) => {
        if (err) {
        console.log(err)
        return res.status(400).send({
        error: true,
        statusCode: 400,
        message: err
        });
        }
        return res.status(200).send({
        error:false,
        statusCode: 300,
        message: 'The user has been registerd with us!'
        });
        }
    );
}

function LoginAuditTrail(){
    return "mwox is testing"
}