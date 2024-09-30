CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `root`@`localhost` 
    SQL SECURITY DEFINER
VIEW `sas_db`.`track_application_view` AS
    (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        UCASE(`u`.`name`) AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        UCASE(`a`.`school_name`) AS `school_name`,
        `a`.`category` AS `category`,
        UCASE(`c`.`name`) AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        UCASE(`a`.`zone_name`) AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`established_schools_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`registered_schools_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`school_owners_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`school_managers_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`streams_change_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`owners_change_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`managers_change_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`name_change_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`transfer_change_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`deregistration_change_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`tahasusi_change_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`dahalia_change_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`bweni_change_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4)) UNION (SELECT 
        `a`.`tracking_number` AS `tracking_number`,
        `a`.`app_name` AS `application_category`,
        `u`.`name` AS `applicant_name`,
        `a`.`created_at` AS `application_created_at`,
        IFNULL(`m`.`maoni_created_at`, `a`.`created_at`) AS `submitted_created_at`,
        `a`.`school_name` AS `school_name`,
        `a`.`category` AS `category`,
        `c`.`name` AS `title`,
        `a`.`region` AS `region_name`,
        `a`.`district` AS `district_name`,
        `a`.`ward` AS `ward_name`,
        `a`.`street` AS `street_name`,
        `a`.`zone_name` AS `zone_name`,
        `a`.`is_approved` AS `status`,
        `p`.`status` AS `payment_status`,
        `p`.`id` AS `payment_status_id`
    FROM
        ((((((((`sas_db`.`registration_change_view` `a`
        JOIN `sas_db`.`applications` `ap` ON (`ap`.`tracking_number` = `a`.`tracking_number`))
        LEFT JOIN `sas_db`.`users` `u` ON (`u`.`id` = `a`.`user_id`))
        LEFT JOIN `sas_db`.`staffs` `s` ON (`s`.`id` = `a`.`staff_id`))
        LEFT JOIN `sas_db`.`roles` `c` ON (`c`.`id` = `s`.`user_level`))
        LEFT JOIN (SELECT 
            `m2`.`created_at` AS `maoni_created_at`,
                `m2`.`trackingNo` AS `trackingNo`
        FROM
            `sas_db`.`maoni` `m2`
        WHERE
            `m2`.`id` = (SELECT 
                    MAX(`m3`.`id`)
                FROM
                    `sas_db`.`maoni` `m3`)
        LIMIT 1) `m` ON (`a`.`tracking_number` = `m`.`trackingNo`))
        LEFT JOIN `sas_db`.`zones` `z` ON (`s`.`zone_id` IS NOT NULL
            AND `z`.`id` = `s`.`zone_id`))
        LEFT JOIN `sas_db`.`payment_statuses` `p` ON (`p`.`id` = `a`.`payment_status_id`))
        LEFT JOIN `sas_db`.`vyeo` `v` ON (`v`.`id` = `c`.`vyeoId`))
    WHERE
        `ap`.`is_complete` IN (0 , 1)
            AND `ap`.`is_approved` IN (0 , 1, 4))