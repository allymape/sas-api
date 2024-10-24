CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `root`@`localhost` 
    SQL SECURITY DEFINER
VIEW `school_locations_map_view` AS
    SELECT 
        `sr`.`tracking_number` AS `tracking_number`,
        `e`.`school_name` AS `name`,
        `sr`.`registration_number` AS `registration_number`,
        `sr`.`registration_date` AS `registration_date`,
        CASE
            WHEN `sc`.`id` = 1 THEN 'AWALI'
            WHEN `sc`.`id` = 2 THEN 'MSINGI'
            WHEN `sc`.`id` = 3 THEN 'SEKONDARI'
            WHEN `sc`.`id` = 4 THEN 'CHUO'
        END AS `category`,
        `sc`.`id` AS `category_id`,
        `a`.`registry_type_id` AS `registry_type_id`,
        CASE
            WHEN `a`.`registry_type_id` IN (1 , 2) THEN 'PRIVATE'
            WHEN `a`.`registry_type_id` = 3 THEN 'GOVERNMENT'
        END AS `ownership`,
        `e`.`latitude` AS `latitude`,
        `e`.`longitude` AS `longitude`,
        UCASE(`aav`.`region`) AS `region`,
        UCASE(`aav`.`district`) AS `district`,
        UCASE(`aav`.`ward`) AS `ward`,
        UCASE(`aav`.`street`) AS `street`,
        `aav`.`region_code` AS `region_code`,
        `aav`.`district_code` AS `district_code`,
        `aav`.`ward_code` AS `ward_code`,
        `aav`.`street_code` AS `street_code`,
        `aav`.`zone_id` AS `zone_id`
    FROM
        ((((`establishing_schools` `e`
        JOIN `school_registrations` `sr` ON (`sr`.`establishing_school_id` = `e`.`id`))
        JOIN `school_categories` `sc` ON (`sc`.`id` = `e`.`school_category_id`))
        JOIN `administration_areas_view` `aav` ON (`aav`.`street_code` = `e`.`village_id`))
        JOIN `applications` `a` ON (`a`.`tracking_number` = `sr`.`tracking_number`))
    WHERE
        `e`.`latitude` IS NOT NULL
            AND `e`.`longitude` IS NOT NULL
    ORDER BY `e`.`school_name`