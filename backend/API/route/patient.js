const express = require('express')
const router = express.Router()
const { ensurePatient, ensureGuest } = require("../middleware/checkauth")
const patient = require('../controllers/patient')
const { validate } = require('../functions/validate')
const validationResult = require('../controllers/validationResult')

const mysql = require('mysql2')
const configDB = require('../config/configDB')
const connection = mysql.createConnection(configDB.connection)
const {v4 : uuidv4} = require('uuid')

router.get('/dashboard', ensurePatient, patient.getPatientDashboard)

router.get('/profile', ensurePatient, patient.getPatientProfile)

router.put('/profile', ensurePatient, validate('Patient-Edit'), validationResult.patientEdit, patient.putPatientProfile)

router.get('/emailchange', ensurePatient, patient.getEmailChange )

router.put('/emailchange', ensurePatient, validate('Email'), validationResult.emailOrPasswordChange, patient.putEmailChange )

router.get('/passwordchange', ensurePatient, patient.getPasswordChange )

router.get('/blooddonation', ensurePatient, patient.getBlood)

router.put('/passwordchange', ensurePatient, validate('Password'), validationResult.emailOrPasswordChange, patient.putPasswordChange )

router.get('/appointmentbook', ensurePatient, (req, res) =>{
    connection.query("select distinct specialization from doctor;", [], (err, rows) => {
        if(err) console.log(err);
        else{
            console.log("HERE: "+rows)
            return res.render('../views/patient/appointment', {doctors:rows})
        }
    })
})

router.post('/appointmentbook', ensurePatient, (req, res, next) => {
    if(!req.body.specialization || !req.body.message){
        req.flash("Please fill in all the details.")
        res.redirect('/patient/dashboard')    
    }
    else{
        const newID = uuidv4();
        console.log('paitent appt uuid: ' + newID)
        let query="insert into appointment (Appointment_id, message, department, Patient_id) values (?,?,?,?)"
        connection.query(query,
            [newID, req.body.message, req.body.specialization, req.user.Patient_id],
            (err, rows) =>{
                if(err){
                    req.flash('error', 'Error in appointment post')
                    console.log('Err in appt post: '+err)
                    res.redirect('/patient/dashboard')
                }
                else{
                    req.flash('success', 'Appointment posted, please check the assigned time in Upcoming Appointments Tab')
                    console.log("Appointment post: "+rows)
                    res.redirect('/patient/dashboard')
                }
            })
    }

})

router.get('/upcomingappointments', ensurePatient, (req, res, next) => {
    connection.query("select a.*, CONCAT(d.Fname, ' ', d.Lname) as Dname from appointment a, doctor d where patient_id = ? and a.Not_pending=false and a.Time_assigned is not null and a.Doctor_id is not null and a.Doctor_id = d.Doctor_id;", [req.user.Patient_id], (err, rows) => {
        if(err){
            console.log("ERR:"+err)
            res.redirect('/patient/dashboard')
        }else{            
            connection.query("select * from appointment where patient_id=? and Time_assigned is not null and Doctor_id is null;", [req.user.Patient_id], (err, rows2) =>{
            if(err){
                console.log(err)
                res.redirect("/patient/dashboard")
            }
            else{
                console.log("Showing upcoming appointments: "+rows+" "+rows2)
                res.render('../views/patient/upcomingappointments.ejs', {rows:rows, rows2:rows2})
            }           
            })
        }
    })
})

router.get('/pendingappointments', ensurePatient, (req, res, next) =>{
    connection.query("Select * from appointment where Time_assigned is null and patient_id = ?", [req.user.Patient_id], (err, rows) =>{
        if(err){
            console.error(err);
            res.redirect('/patient/dashboard')
        }else{
            console.log("Showing pending appointments: "+rows)
            res.render('../views/patient/pendingappointments.ejs', {rows:rows})
        }
    })
})

router.get('/prescriptions', ensurePatient, (req, res, next) =>{
    connection.query("Select a.*, CONCAT(d.Fname, ' ', d.Lname) as Dname from appointment a, doctor d where a.doctor_id=d.doctor_id and Patient_id=? and Not_pending=true;", [req.user.Patient_id], (err, rows) =>{
        if(err){
            console.log(err)
            res.redirect('/patient/dashboard')
        }else{
            console.log("Showing prescriptions: "+rows)
            res.render('../views/patient/prescriptions.ejs', {rows:rows})
        }
    })
})

router.get("/delete/:id", ensurePatient, (req, res) => {
    connection.query("delete from appointment where appointment_id=?; ", [req.params.id], (err ,result) => {
        if(err){
            console.log(err)
        } else {
            req.flash("success", "Deleted appointment")
            res.redirect("/patient/dashboard")
        }
    })
})

module.exports = router
