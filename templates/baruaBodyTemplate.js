const bodyContent = (application_category_id , registry_type) => {
  let bodyContent = null;
  switch (application_category_id) {
    case 1:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 2:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 4:
       bodyContent = registry_type == 3 ? usajiliSerikali() : usajiliBinafsi()
      break;
    case 5:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 6:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 7:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 8:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 8:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 9:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 10:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 11:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 12:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 13:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;
    case 14:
      bodyContent = [
        `      Tafadhali rejea somo la barua hii.\n\n\n`,
        `2.    Ninafurahi kukufahimisha kuwa uthibitisho umetolewa kwa <b>Zainabu Ally</b> Mweta kuwa Meneja wa Shule ya Awali na Msingi <b>Fedha Boys</b>\n\n`,
        `3.    Uthibitisho huu umetolewa tarehe <b>27/12/2023</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353.</b> Utaindesha shule hii kwa kuzingatia <b>Sheria, Kanuni, Taratibu na Miongozo</b> ya Wizara ya Elimu, Sayansi na Teknolojia. Hakikisha shule ina <b>kasiki</b> kwa ajili ya kuhifadhia nyaraka nyeti.\n\n`,
        `4.    Uthibitisho huu siyo kibali cha kusajili Wanafunzi.\n\n\n`,
        `5.    <b>Ninakutakia utekelezaji mwema.</b>`,
      ];
      break;default:
      break;
  }
   return bodyContent;
};

const usajiliSerikali = (school_name , region , council) => {
    return [
      `      Tafadhali rejea somo la barua hii.\n\n\n`,
      `2.	Napenda kukujulisha kuwa Wizara imekubali maombi ya Halmashauri ya Wilaya ya ${council} ya kusajili Shule ya Sekondari ${school_name} itakayomilikiwa na wananchi wa Halmashauri ya Wilaya ya ${council}. kwa kushirikiana na Mkoa wa ${region}`,
      `3.	Mkoa unaruhusiwa kuchagua wanafunzi wa Kidato cha Kwanza kwa mwaka 2023.  Shule itakuwa ya kutwa, mchanganyiko na yenye mkondo mmoja (01). Shule hii imesajiliwa rasmi tarehe 17/02/2023 na kupewa namba ya usajili kama ifuatavyo:`,
      `<table/>`,
      `4.	Wizara inaiagiza   Halmashauri ya Wilaya ya ${council} kuendelea kukamilisha ujenzi wa miundombinu yote.  Endapo miundombinu haitakamilika,  Halmashauri haitaruhusiwa kuandikisha Wanafunzi wa kidato cha kwanza Januari 2024.`,
      `5.	Mkuu wa Shule atapaswa kuifahamisha Wizara sanduku la barua la shule pindi litakapofunguliwa ili kurahisisha mawasiliano. Aidha, mfahamishe Katibu Mtendaji wa Baraza la Mitihani ni lini shule itakuwa na Wanafunzi watakaofanya Mtihani wa Taifa. `,
      `6.	Kwa mujibu wa Waraka wa Elimu Na. 10 wa mwaka 2011, Usajili wa shule hii utarudiwa baada ya miaka 4.`,
      `7.	Nakutakia utekelezaji mwema.`,
    ];
}
const usajiliBinafsi = (school_name, registration_date, registration_number) => {
  return [
    `      Tafadhali rejea somo la barua hii.\n\n\n`,
    `2	Ninafurahi kukujulisha kuwa shule ya Awali na Msingi ${school_name} imesajiliwa tarehe ${registration_date} kwa mujibu wa Sheria ya Elimu, Sura ya 353.`,
    `3.	Shule imepewa namba ya Usajili ${registration_number} kuwa shule ya Awali na Msingi na jina Jehovah Shalom limeidhinishwa. Shule hii ni ya kutwa, na mchanganyiko na imeidhinishwa kuwa na Mkondo Mmoja (01) inayotumia lugha ya Kiingereza kufundishia na kujifunzia. `,
    `4.	Kufuatana na Sheria ya Elimu, Sura 353, cheti cha Usajili kiwekwe bayana na Uongozi wa Shule uwe tayari kukionesha iwapo kitatakiwa. Hakikisha kuwa Kamati ya Shule inaundwa katika muda wa miezi sita baada ya usajili. Kulingana na Waraka wa Elimu Na. 10 wa mwaka 2011 usajili wa shule hii utarudiwa baada ya miaka 4.`,
    `5.	Mmiliki wa Shule atatakiwa kuja kuchukua cheti  cha usajili  wa shule akiwa  na kitambulisho  chake  mwezi  mmoja baada ya kupokea  barua hii.`,
    `6.	Ninakutakia utekelezaji mwema.`,
  ];
};
module.exports = { bodyContent };
