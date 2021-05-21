var express = require("express");
var router = express.Router();
var nodemailer = require('nodemailer');

// Load input validation
const validateJobInput = require("../validation/job.validation");

// Load Jobs model
const Job = require("../models/job.model");
const Application = require("../models/application.model");

// ADD JOB
// @route POST jobs/create
// @access Public
router.post("/create", (req, res) => {
    
    // Form validation
    const { errors, isValid } = validateJobInput(req.body);
    // Check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
        
    const newJob = new Job({
        title: req.body.title,
        rec_email: req.body.rec_email,
        rec_name: req.body.rec_name,
        max_positions: req.body.max_positions,
        max_applications: req.body.max_applications,
        duration: req.body.duration,
        jobtype: req.body.jobtype,
        salary: req.body.salary,
        deadline: req.body.deadline,
        skills: req.body.skills,
    });

    newJob.save()
        .then(job => res.json(job))
        .catch(err => res.json(err));       
            
});

// GET request 
// Getting all jobs
// @route   GET jobs/

router.get("/", function(req, res) {
    Job.find( 
        {deadline: { "$gte": Date.now() }},
        (err, jobs) => {
            if (err) {
                res.json(err);
            } else {
                res.json(jobs);
            }
	})
});

// Apply for JOB
// @route POST jobs/apply
// @access Public
router.post("/apply", (req, res) => {
        
    const newApplication = new Application({
        jobId: req.body.jobId,
        appId: req.body.appId,
        sop: req.body.sop,
        recMail: req.body.recMail,
    });

    newApplication.save()
        .then(application => {
            Job
                .findById(req.body.jobId)
                .then(job => {
                    const new_no_apps = job.no_applications + 1;
                    Job.findByIdAndUpdate(req.body.jobId, {no_applications: new_no_apps})
                        .then(res => {
                            console.log("Job updated");
                            // res.json(application);
                        })
                        .catch(err => {
                            console.log(err);
                            res.status(400).send(err);
                        })
                    })
                .catch(err => {
                    console.log(err);
                    res.status(400).send(err);
                })
            res.json(application);
            
        })
        .catch(err => res.status(400).json(err));
});

// Show applicant's applications
// @route POST jobs/myapps
// @access Public
router.post("/myapps", (req, res) => {

    const applicantId = req.body.appId;
        
    Application
        .find({appId: applicantId})
        .populate('jobId')
        .exec()
        .then((err,docs) => {
            if (err) {
                res.json(err);
            } else {
                res.json(docs);
            }
        })
        .catch(err => res.json(err));
});

// Show recruiter's jobs
// @route POST jobs/myjobs
// @access Public
router.post("/myjobs", (req, res) => {

    const mail = req.body.rec_email;
        
    Job
        // .find({rec_email: rec_email})
        .find({rec_email: mail})
        .exec()
        .then((err,docs) => {
            if (err) {
                res.json(err);
            } else {
                res.json(docs);
            }
        })
        .catch(err => res.json(err));
});

// Show all applications for a job
// @route POST jobs/jobapps
// @access Public
router.post("/jobapps", (req, res) => {

    const jobId = req.body.jobId;
        
    Application
        .find({jobId: jobId})
        .populate('jobId')
        .populate({
            path : 'appId',
            populate : {
              path : 'aprofileId'
            }
          })
        .exec()
        .then((err,docs) => {
            if (err) {
                res.json(err);
            } else {
                res.json(docs);
            }
        })
        .catch(err => res.json(err));
});

// Accept applicant to job by recruiter
// @route POST jobs/accept
// @access Public
router.post("/accept", (req, res) => {

    const applicationId = req.body.applicationId;
    const status = req.body.status;
    
    if(status==="Applied"){
        Application
            .findByIdAndUpdate(
                applicationId,
                {$set:{status:'Shortlisted'}},
                {new: true}
            )
            .then( () => res.json('Status changed to shortlisted'))
            .catch(err => res.status(400).json(err));
    }

    if(status==="Shortlisted"){
        Application
            .findByIdAndUpdate(
                applicationId,
                {$set:{status:'Accepted',dateofjoining:new Date()}},
                {new: true}
            )
            .then( application => {

                User
                    .findById(application.appId)
                    .then(app => {

                        User.findOne({email:application.recMail})
                            .then(rec => {
                                var mailtext = 'Congrats, your job request has been accepted by ' + rec.name;

                                var transporter = nodemailer.createTransport({
                                    service: 'gmail',
                                    auth: {
                                        user: 'jobshijobs69@gmail.com',
                                        pass: 'jobs.hi.jobs.69'
                                    }
                                });
                                  
                                var mailOptions = {
                                    from: 'jobshijobs69@gmail.com',
                                    to: app.email,
                                    subject: 'Accepted Job Application',
                                    text: mailtext,
                                };
                                  
                                transporter.sendMail(mailOptions, function(error, info){
                                    if (error) {
                                      console.log(error);
                                    } else {
                                      console.log('Email sent: ' + info.response);
                                    }
                                });
                            })
                        
                    })
                
                res.json('Status changed to accepted');
                
                // check for other applications of applicant and reject them
                let applicantId = application.appId;
                Application
                    .updateMany(
                        {appId:applicantId,status: "Applied"}, 
                        {$set:{status:'Rejected'}},
                        {new: true},
                        (err,docs) => {
                            if(err){res.json(err)}
                            else{console.log(docs)}
                        }
                    );

                Application
                    .updateMany(
                        {appId:applicantId,status: "Shortlisted"}, 
                        {$set:{status:'Rejected'}},
                        {new: true},
                        (err,docs) => {
                            if(err){res.json(err)}
                            else{console.log(docs)}
                        }
                    );
                
                // check if job full and reject all other applications
                let jobId = application.jobId;
                Job
                    .findById(jobId)
                    .then(job => {
                        const new_no_pos = job.no_positions + 1;
                        Job.findByIdAndUpdate(req.body.jobId, {no_positions: new_no_pos})
                            .then(res => {
                                console.log("Job updated");
                            })
                            .catch(err => {
                                console.log(err);
                                res.status(400).send(err);
                            });

                        if(new_no_pos>=job.max_positions)
                        {
                            // reject
                            Application
                                .updateMany(
                                    {jobId:jobId}, 
                                    {$set:{status:'Rejected'}},
                                    {new: true},
                                    (err,docs) => {
                                        if(err){res.json(err)}
                                        else{console.log(docs)}
                                    }
                                );
                            // acccept og applicant
                            Application
                                .findByIdAndUpdate(
                                    req.body.applicationId,
                                    {$set:{status:'Accepted'}},
                                    {new: true},
                                    (err,docs) => {
                                        if(err){res.json(err)}
                                        else{console.log(docs)}
                                    }
                                )
                        }
                    })
                    
            })
            .catch(err => res.status(400).json(err));
    }
});

// Reject applicant by recruiter
// @route POST jobs/accept
// @access Public
router.post("/reject", (req, res) => {

    const applicationId = req.body.applicationId;
    const status = req.body.status;
    
    Application
        .findByIdAndUpdate(
            applicationId,
            {$set:{status:'Rejected'}},
            {new: true}
        )
        .then( () => res.json('Status changed to rejected'))
        .catch(err => res.status(400).json(err));
});


// Get employees of recruiter
// @route POST jobs/accept
// @access Public
router.post("/getemp", (req, res) => {

    const recMail = req.body.recMail;
    
    Application
        .find({recMail:recMail,status:'Accepted'})
        .populate('jobId')
        .populate({
            path : 'appId',
            populate : {
              path : 'aprofileId'
            }
          })
        .exec()
        .then((err,docs) => {
            if (err) {
                res.json(err);
            } else {
                res.json(docs);
            }
        })
        .catch(err => res.json(err));
});

// Get open apps of applicant
// @route POST jobs/accept
// @access Public
router.post("/getopenapps", (req, res) => {

    const appId = req.body.appId;
    
    Application
        .find({appId:appId,$or:[ {status:'Applied'}, {status:'Shortlisted'} ]})
        .then((err,docs) => {
            if (err) {
                res.json(err);
            } else {
                res.json(docs);
            }
        })
        .catch(err => res.json(err));
});

// Get accepted apps of applicant
// @route POST jobs/accept
// @access Public
router.post("/getacceptedapps", (req, res) => {

    const appId = req.body.appId;
    
    Application
        .find({appId:appId,status:'Accepted'})
        .then((err,docs) => {
            if (err) {
                res.json(err);
            } else {
                res.json(docs);
            }
        })
        .catch(err => res.json(err));
});

router.post("/editjob", (req, res) => {

    const jobId = req.body.jobId;
    
    Job
        .findByIdAndUpdate(
            jobId,
            {$set:{
                max_positions:req.body.max_positions,
                max_applications:req.body.max_applications,
                deadline:req.body.deadline,
            }},
            {new: true}
        )
        .then((err,docs) => {
            if (err) {
                res.json(err);
            } else {
                res.json(docs);
            }
        })
        .catch(err => res.json(err));
});

router.post("/deletejob", (req, res) => {

    const jobId = req.body.jobId;
    
    Job
        .deleteOne({_id:jobId})
        .then((err,docs) => {
            if (err) {
                res.json(err);
            } else {
                Application
                    .deleteMany({jobId:jobId})
                    .then(()=>{res.json(docs);})
            }
        })
        .catch(err => res.json(err));
});


module.exports = router;