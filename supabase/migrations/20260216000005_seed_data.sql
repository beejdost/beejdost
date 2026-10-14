-- ============================================================================
-- Migration: 20260216000005_seed_data.sql
-- Description: Seed authentic agricultural crops with English, Urdu, and Shahmukhi translations
-- ============================================================================

INSERT INTO public.crops (
  slug,
  name_en,
  name_ur,
  name_pa,
  category,
  scientific_name,
  description_en,
  description_ur,
  description_pa,
  is_approved
)
VALUES
  (
    'basmati-rice',
    'Basmati Rice',
    'باسمتی چاول',
    'باسمتی چول',
    'cereal',
    'Oryza sativa',
    'Heritage aromatic slender-grain rice originating from the historic Kallar tract of Punjab.',
    'پنجاب کے تاریخی کلر ٹریکٹ سے تعلق رکھنے والا خوشبودار اور باریک روایتی چاول۔',
    'پنجاب دی نہری دھرتی دا اصلی لمبا تے خشبو دار دیسی چول۔',
    TRUE
  ),
  (
    'desi-wheat',
    'Heritage Wheat (Gandum)',
    'روایتی گندم',
    'دیسی کݨک',
    'cereal',
    'Triticum aestivum',
    'Drought-tolerant heirloom wheat varieties suited for rainfed (barani) and canal regions.',
    'بارانی اور نہری علاقوں کے لیے موزوں خشک سالی کی مدافعت رکھنے والی روایتی دیسی گندم۔',
    'بارانی تے نہری تھاں لئی ڈھکویں سُکی دیسی کݨک دی ونڈ۔',
    TRUE
  ),
  (
    'desi-cotton',
    'Desi Tree Cotton (Gossypium arboreum)',
    'دیسی کپاس',
    'دیسی کپا',
    'cotton',
    'Gossypium arboreum',
    'Indigenous pest-resistant desi tree-cotton thriving in high temperatures without synthetic pesticides.',
    'کیڑوں سے قدرتی مدافعت رکھنے والی مقامی دیسی کپاس جو شدید گرمی میں بھی بغیر کیمیائی اسپرے پنپتی ہے۔',
    'کیڑیاں توں پاک رہن والی اصلی دیسی کپا جہڑی بغیر اسپرے توں چوکھی پیداوار دیندی اے۔',
    TRUE
  ),
  (
    'mung-bean',
    'Mung Bean (Green Gram)',
    'مونگ دال',
    'مونگی دال',
    'pulses',
    'Vigna radiata',
    'Short-duration legume that enriches soil nitrogen and thrives in arid summer rotations.',
    'کم مدت میں تیار ہونے والی دال جو زمین میں نائٹروجن بڑھاتی ہے اور موسم گرما کے لیے موزوں ہے۔',
    'گھٹ ورھے وچ تیار ہون والی دال جہڑی بھوئیں نوں زرخیز بناوندی اے۔',
    TRUE
  ),
  (
    'desi-chickpea',
    'Desi Black Chickpea (Kala Chana)',
    'دیسی کالا چنا',
    'کالا چھولا',
    'pulses',
    'Cicer arietinum',
    'Deep-rooted rainfed chickpea variety naturally adapted to Thal desert and sandy loam soils.',
    'تھل اور ریتلے علاقوں کے لیے موزوں گہری جڑوں والا بارانی چنا۔',
    'تھل دی ریتلی بھوئیں لئی خاص ڈونگھی جڑ والا دیسی کالا چھولا۔',
    TRUE
  ),
  (
    'sarson-mustard',
    'Mustard Seed (Sarson)',
    'روایتی سرسوں',
    'دیسی سرھوں',
    'oilseeds',
    'Brassica juncea',
    'Winter brassica cultivar providing high edible oil content and rich green winter fodder.',
    'موسم سرما کی روغنی فصل جو خالص خوردنی تیل اور سرسبز ساگ فراہم کرتی ہے۔',
    'سیال دی مشہور فصل جہڑی اصلی کوڑھا تیل تے مٹھی سرھوں دا ساگ دیندی اے۔',
    TRUE
  ),
  (
    'til-sesame',
    'Sesame Seed (Til)',
    'تل بیج',
    'تل بیج',
    'oilseeds',
    'Sesamum indicum',
    'High-value drought-tolerant oilseed cultivated in Punjab and Sindh riverine belts.',
    'پنجاب اور سندھ کے دریائی علاقوں میں کاشت ہونے والا قیمتی اور کم پانی مانگنے والا روغنی بیج۔',
    'پنجاب تے سندھ دے پتن تے کاشت ہون والا گھٹ پانی نال پلن والا قیمتی تل بیج۔',
    TRUE
  ),
  (
    'guar-cluster-bean',
    'Cluster Bean (Guar)',
    'گوارا بیج',
    'گوارا',
    'fodder',
    'Cyamopsis tetragonoloba',
    'Desert-hardy nitrogen-fixing legume with high gum content, suited for Cholistan and Thar.',
    'چولستان اور تھر کے صحرائی علاقوں کے لیے موزوں خشک سالی برداشت کرنے والا پودا۔',
    'تھر تے چولستان دے ریتلے تھاں لئی چارہ تے گوند والا دیسی گوارا۔',
    TRUE
  ),
  (
    'swat-red-rice',
    'Mountain Red Rice (Chorr Shali)',
    'سواتی لال چاول',
    'سواتی لال چول',
    'cereal',
    'Oryza sativa japonica',
    'Cold-tolerant high-altitude red rice from Swat valley, rich in minerals and iron.',
    'وادی سوات کا سردی برداشت کرنے والا اونچی جگہ کا روایتی سرخ چاول۔',
    'سوات دی اچی پعاڑی وادیاں دا ٹھنڈ سہن والا اصلی لال چول۔',
    TRUE
  ),
  (
    'karez-melon',
    'Karez Sweet Melon',
    'پشین میٹھا خربوزہ',
    'میٹھا خربوزہ',
    'vegetables',
    'Cucumis melo',
    'Heirloom sweet melon variety from Balochistan irrigated by subterranean karez channels.',
    'بلوچستان کی کاریز سے سیراب ہونے والی انتہائی میٹھی اور خوشبودار روایتی قسم۔',
    'بلوچستان دی کاریز توں پلن والا مٹھا تے خشبو دار خربوزہ۔',
    TRUE
  ),
  (
    'skardu-buckwheat',
    'Buckwheat (Ogla / Phaphra)',
    'کٹو / باک ویٹ',
    'اوگلا اناج',
    'cereal',
    'Fagopyrum esculentum',
    'Gluten-free traditional Himalayan grain from Baltistan with 70-day maturity.',
    'بلتستان کا روایتی گلوٹین فری اناج جو صرف ستر دن میں پک کر تیار ہو جاتا ہے۔',
    'بلتستان دا روایتی پعاڑی اناج جہڑا صرف ستر دناں وچ تیار ہو جاندا اے۔',
    TRUE
  )
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ur = EXCLUDED.name_ur,
  name_pa = EXCLUDED.name_pa,
  category = EXCLUDED.category,
  scientific_name = EXCLUDED.scientific_name,
  description_en = EXCLUDED.description_en,
  description_ur = EXCLUDED.description_ur,
  description_pa = EXCLUDED.description_pa,
  is_approved = EXCLUDED.is_approved;
