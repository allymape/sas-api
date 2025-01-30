require("dotenv").config();
const express = require("express");
const updateSchoolDetailRouter = express.Router();
const { isAuth } = require("../utils.js");

const updateSchoolDetailModel = require("../models/updateSchoolDetailModel.js");
const sharedModel = require("../models/sharedModel.js");

// Edit Shule
updateSchoolDetailRouter.get("/edit-school-detail/:tracking_number/edit", isAuth, (req, res) => {
    updateSchoolDetailModel.getSchoolInfo(req.params.tracking_number , (school_info , owner ,manager , school_combinations) => {
        sharedModel.getSchoolCategories((school_categories) => {
              sharedModel.getLanguages((languages) => {
                   sharedModel.getSchoolSubCategories((school_sub_categories) => {
                        sharedModel.getBuildingStructures((building_structures) => {
                            sharedModel.getSchoolGender((genders) => {
                                sharedModel.getSchoolSpecialization((specializations) => {
                                   sharedModel.getCombinations((combinations) => {
                                    sharedModel.getCurriculum((curriculums) => {
                                          sharedModel.getCertificates((certificates) => {
                                                sharedModel.getSectNames(
                                                  (sect_names) => {
                                                    sharedModel.getRegistrationStructures(
                                                      (registration_structures) => {
                                                        sharedModel.getOwnershipSubType((ownership_sub_types) => {
                                                          sharedModel.getDenominations((denominations) => {
                                                                  res.send({
                                                                    school_info,
                                                                    owner,
                                                                    manager,
                                                                    school_combinations,
                                                                    languages,
                                                                    school_categories,
                                                                    school_sub_categories,
                                                                    building_structures,
                                                                    genders,
                                                                    specializations,
                                                                    combinations,
                                                                    registration_structures,
                                                                    curriculums,
                                                                    certificates,
                                                                    sect_names,
                                                                    ownership_sub_types,
                                                                    denominations,
                                                                  });
                                                          })
                                                        })
                                                      }
                                                    );
                                                  }
                                                );
                                            });
                                          });
                                        });
                                      });
                                  });
                              });
                      });
                   });
              })
          })
});
// Update Shule Details
updateSchoolDetailRouter.put("/update-school-detail/:tracking_number", isAuth, (req, res) => {
    updateSchoolDetailModel.updateSchoolInfo(req.params.tracking_number , req.body , (error , success) => {
        // console.log(success)
        res.send({
          statusCode: success ? 300 : 306,
          message: error
            ? "Haujafanikiwa kubadili taarifa za shule, wasiliana na msimamizi wa Mfumo."
            : (success
            ? "Umefanikiwa kubadili taarifa za shule"
            : "Hakuna taarifa mpya iliyobadilishwa."),
        });
    })
});
module.exports = updateSchoolDetailRouter;
