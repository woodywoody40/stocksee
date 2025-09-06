// A comprehensive list of major Taiwan Stock Exchange (TWSE) listed companies
// This enables searching for stocks by their Chinese name or English alias.
export const TW_STOCKS: { code: string; name: string; alias?: string[] }[] = [
  // ETFs
  { code: '0050', name: '元大台灣50', alias: ['taiwan 50'] },
  { code: '0056', name: '元大高股息', alias: ['high dividend'] },
  { code: '006208', name: '富邦台50' },
  { code: '00632R', name: '元大台灣50反1' },
  { code: '00677U', name: '期元大S&P原油反1' },
  { code: '00713', name: '元大台灣高息低波' },
  { code: '00878', name: '國泰永續高股息' },
  { code: '00881', name: '國泰台灣5G+' },
  { code: '00900', name: '富邦特選高股息30' },
  { code: '00919', name: '群益台灣精選高息' },
  { code: '00929', name: '復華台灣科技優息' },
  { code: '00939', name: '統一台灣高息動能' },
  { code: '00940', name: '元大台灣價值高息' },

  // Cement
  { code: '1101', name: '台泥' },
  { code: '1102', name: '亞泥' },

  // Food
  { code: '1216', name: '統一' },
  { code: '1227', name: '佳格' },
  { code: '1232', name: '大統益' },
  
  // Plastics
  { code: '1301', name: '台塑' },
  { code: '1303', name: '南亞' },
  { code: '1326', name: '台化' },
  { code: '1304', name: '台聚' },
  { code: '1305', name: '華夏' },

  // Textiles
  { code: '1402', name: '遠東新' },
  { code: '1476', name: '儒鴻' },
  { code: '1477', name: '聚陽' },

  // Electrical Machinery
  { code: '1504', name: '東元' },
  { code: '1513', name: '中興電' },
  { code: '1519', name: '華城' },
  { code: '1536', name: '和大' },

  // Wire & Cable
  { code: '1605', name: '華新' },

  // Chemical
  { code: '1722', name: '台肥' },
  { code: '1723', name: '中碳' },
  { code: '1795', name: '美時' },

  // Iron & Steel
  { code: '2002', name: '中鋼' },
  { code: '2014', name: '中鴻' },
  { code: '2027', name: '大成鋼' },

  // Rubber
  { code: '2105', name: '正新' },

  // Automotive
  { code: '2201', name: '裕隆' },
  { code: '2207', name: '和泰車' },

  // Electronics & Semiconductors
  { code: '2301', name: '光寶科' },
  { code: '2303', name: '聯電', alias: ['umc'] },
  { code: '2308', name: '台達電', alias: ['delta', 'delta electronics'] },
  { code: '2317', name: '鴻海', alias: ['foxconn', 'hon hai'] },
  { code: '2327', name: '國巨' },
  { code: '2330', name: '台積電', alias: ['tsmc'] },
  { code: '2345', name: '智邦' },
  { code: '2354', name: '鴻準' },
  { code: '2357', name: '華碩', alias: ['asus'] },
  { code: '2379', name: '瑞昱', alias: ['realtek'] },
  { code: '2382', name: '廣達', alias: ['quanta'] },
  { code: '2395', name: '研華', alias: ['advantech'] },
  { code: '2408', name: '南亞科' },
  { code: '2409', name: '友達', alias: ['auo'] },
  { code: '2412', name: '中華電', alias: ['cht'] },
  { code: '2454', name: '聯發科', alias: ['mediatek'] },
  { code: '2474', name: '可成' },
  { code: '2481', name: '強茂' },
  { code: '3008', name: '大立光', alias: ['largan'] },
  { code: '3034', name: '聯詠', alias: ['novatek'] },
  { code: '3037', name: '欣興' },
  { code: '3231', name: '緯創', alias: ['wistron'] },
  { code: '3443', name: '創意' },
  { code: '3481', name: '群創', alias: ['innolux'] },
  { code: '3533', name: '嘉澤' },
  { code: '3661', name: '世芯-KY' },
  { code: '3711', name: '日月光投控', alias: ['ase technology'] },
  { code: '4938', name: '和碩', alias: ['pegatron'] },
  { code: '4966', name: '譜瑞-KY' },
  { code: '5269', name: '祥碩' },
  { code: '6239', name: '力成' },
  { code: '6269', name: '台郡' },
  { code: '6274', name: '台燿' },
  { code: '6415', name: '矽力-KY' },
  { code: '6669', name: '緯穎' },
  { code: '6770', name: '力積電' },
  { code: '8046', name: '南電' },
  { code: '8299', name: '群聯' },

  // Shipping & Transportation
  { code: '2603', name: '長榮', alias: ['evergreen marine'] },
  { code: '2609', name: '陽明', alias: ['yang ming'] },
  { code: '2610', name: '華航', alias: ['china airlines'] },
  { code: '2615', name: '萬海', alias: ['wan hai'] },
  { code: '2618', name: '長榮航', alias: ['eva air'] },

  // Finance & Insurance
  { code: '2801', name: '彰銀' },
  { code: '2880', name: '華南金' },
  { code: '2881', name: '富邦金', alias: ['fubon'] },
  { code: '2882', name: '國泰金', alias: ['cathay'] },
  { code: '2883', name: '開發金' },
  { code: '2884', name: '玉山金', alias: ['esun'] },
  { code: '2885', name: '元大金', alias: ['yuanta'] },
  { code: '2886', name: '兆豐金' },
  { code: '2887', name: '台新金', alias: ['taishin'] },
  { code: '2890', name: '永豐金' },
  { code: '2891', name: '中信金', alias: ['ctbc'] },
  { code: '2892', name: '第一金' },
  { code: '5871', name: '中租-KY' },
  { code: '5876', name: '上海商銀' },
  { code: '5880', name: '合庫金' },

  // Retail
  { code: '2912', name: '統一超' },
  { code: '5904', name: '寶雅' },
  
  // Telecommunications
  { code: '3045', name: '台灣大', alias: ['taiwan mobile'] },
  { code: '4904', name: '遠傳', alias: ['far eastone'] },

  // Others
  { code: '6505', name: '台塑化' },
  { code: '9904', name: '寶成' },
  { code: '9910', name: '豐泰' },
  { code: '9921', name: '巨大', alias: ['giant'] },
  { code: '9933', name: '中鼎' },
  { code: '9945', name: '潤泰新' },
];