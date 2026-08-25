-- One-off backfill: re-normalize existing product names to title case.
-- Generated 2026-08-25 to match the updated normalizeProductName()
-- logic in server/src/utils/textFormat.js. Safe to re-run: a no-op once names already match.
-- 56 of 62 products affected.

begin;

-- Britannia marie gold -> Britannia Marie Gold
update public.products set name = 'Britannia Marie Gold' where id = '25690c20-ce48-4af5-9824-1d4308f0aba2' and name = 'Britannia marie gold';

-- Haldi powder -> Haldi Powder
update public.products set name = 'Haldi Powder' where id = 'f8c56090-ce58-47f8-8d55-2495ada2d273' and name = 'Haldi powder';

-- Chilli powder -> Chilli Powder
update public.products set name = 'Chilli Powder' where id = 'b36d94fa-67d1-4ba2-8f9b-ec2306421d98' and name = 'Chilli powder';

-- Mustard powder -> Mustard Powder
update public.products set name = 'Mustard Powder' where id = '2af4f0b6-71f5-4e2b-994e-c4469dce9b35' and name = 'Mustard powder';

-- Shahi garam masala -> Shahi Garam Masala
update public.products set name = 'Shahi Garam Masala' where id = 'b2e04ea0-894d-444a-81f7-5ae090f5f683' and name = 'Shahi garam masala';

-- Lifeboy handwash -> Lifeboy Handwash
update public.products set name = 'Lifeboy Handwash' where id = '6e4b5b48-66f3-4847-8aab-573199e8e9cb' and name = 'Lifeboy handwash';

-- Britannia milk bikis -> Britannia Milk Bikis
update public.products set name = 'Britannia Milk Bikis' where id = '32243612-44d8-4b35-ab86-16dcb459e043' and name = 'Britannia milk bikis';

-- Colgate strong teeth toothpaste -> Colgate Strong Teeth Toothpaste
update public.products set name = 'Colgate Strong Teeth Toothpaste' where id = 'a5230760-c2ea-415b-af82-5e0a63c797e5' and name = 'Colgate strong teeth toothpaste';

-- Dove cream beauty bathing bar -> Dove Cream Beauty Bathing Bar
update public.products set name = 'Dove Cream Beauty Bathing Bar' where id = '189ca9a2-e574-4656-8f0a-6303e3fd2a9a' and name = 'Dove cream beauty bathing bar';

-- Amul mango lassi -> Amul Mango Lassi
update public.products set name = 'Amul Mango Lassi' where id = 'd4ddbf6c-9f65-4b77-b31c-e9f91a805d61' and name = 'Amul mango lassi';

-- Sunfeast marie light -> Sunfeast Marie Light
update public.products set name = 'Sunfeast Marie Light' where id = 'e5515205-7a14-4ea5-8e35-db68df6b7f1e' and name = 'Sunfeast marie light';

-- Parle monaco classic salty biscuits -> Parle Monaco Classic Salty Biscuits
update public.products set name = 'Parle Monaco Classic Salty Biscuits' where id = '0ae69f5d-854e-4f7c-9d3c-7632a56126b2' and name = 'Parle monaco classic salty biscuits';

-- Amul lactose free milk -> Amul Lactose Free Milk
update public.products set name = 'Amul Lactose Free Milk' where id = 'cf7d25cb-a4ed-4a4c-8eca-adacb8c7f212' and name = 'Amul lactose free milk';

-- Amul kool rose -> Amul Kool Rose
update public.products set name = 'Amul Kool Rose' where id = '8c76c446-4597-4126-98de-322c2bfa8b30' and name = 'Amul kool rose';

-- Amul high protein buttermilk -> Amul High Protein Buttermilk
update public.products set name = 'Amul High Protein Buttermilk' where id = 'c9b24dee-3598-43b4-898f-75eed2774e48' and name = 'Amul high protein buttermilk';

-- Coca-cola original taste -> Coca-cola Original Taste
update public.products set name = 'Coca-cola Original Taste' where id = 'c64e5914-abe5-4f18-9a78-96e1206e758f' and name = 'Coca-cola original taste';

-- Fortune sunlite refined sunflower oil -> Fortune Sunlite Refined Sunflower Oil
update public.products set name = 'Fortune Sunlite Refined Sunflower Oil' where id = 'cd767604-5955-40f1-836f-e0b1293c828d' and name = 'Fortune sunlite refined sunflower oil';

-- Biriyani masala -> Biriyani Masala
update public.products set name = 'Biriyani Masala' where id = 'aa952a14-71bb-4d0d-9ee3-0192c11efa23' and name = 'Biriyani masala';

-- Maggi 2-minute masala noodles -> Maggi 2-minute Masala Noodles
update public.products set name = 'Maggi 2-minute Masala Noodles' where id = 'eb0c4989-ef3a-4c0e-98a0-8ccad4fa0478' and name = 'Maggi 2-minute masala noodles';

-- Chicken masala -> Chicken Masala
update public.products set name = 'Chicken Masala' where id = '33c25023-60ea-4787-937a-f62735098417' and name = 'Chicken masala';

-- Parle-g original glucose biscuits -> Parle-g Original Glucose Biscuits
update public.products set name = 'Parle-g Original Glucose Biscuits' where id = 'b7e6563a-2035-471a-86b9-108e2df47cb8' and name = 'Parle-g original glucose biscuits';

-- Dettol handwash -> Dettol Handwash
update public.products set name = 'Dettol Handwash' where id = '3b2b377b-813a-4e68-854a-ec2a679d6fe7' and name = 'Dettol handwash';

-- Sprite soft drink -> Sprite Soft Drink
update public.products set name = 'Sprite Soft Drink' where id = 'ac7c00e3-5554-41b5-99c4-c89ed58382dd' and name = 'Sprite soft drink';

-- Campa cola soft drink carbonated beverage 500 ml -> Campa Cola Soft Drink Carbonated Beverage 500 Ml
update public.products set name = 'Campa Cola Soft Drink Carbonated Beverage 500 Ml' where id = '75f232bf-2ed0-42e1-ae83-047da4950913' and name = 'Campa cola soft drink carbonated beverage 500 ml';

-- Haldiram aloo bhujia -> Haldiram Aloo Bhujia
update public.products set name = 'Haldiram Aloo Bhujia' where id = '9daef594-b852-4514-b1b2-bb6500beefd6' and name = 'Haldiram aloo bhujia';

-- Britannia good day -> Britannia Good Day
update public.products set name = 'Britannia Good Day' where id = '99ba4f2d-c085-4f86-a1a2-43af4295d2e1' and name = 'Britannia good day';

-- Little hearts -> Little Hearts
update public.products set name = 'Little Hearts' where id = '722b7a84-ce3a-4037-871f-2fc198966b1f' and name = 'Little hearts';

-- Dark fantasy -> Dark Fantasy
update public.products set name = 'Dark Fantasy' where id = '45f7c950-32a0-4d54-9391-5f0ab099e465' and name = 'Dark fantasy';

-- Pure magic choco stars -> Pure Magic Choco Stars
update public.products set name = 'Pure Magic Choco Stars' where id = '0ac1d25e-e2fe-448b-91e6-4f7fd8ff2235' and name = 'Pure magic choco stars';

-- Hide & seek choco chip -> Hide & Seek Choco Chip
update public.products set name = 'Hide & Seek Choco Chip' where id = '3857439c-88c1-4429-b5e5-2e10cb097d00' and name = 'Hide & seek choco chip';

-- Amul cheese slices -> Amul Cheese Slices
update public.products set name = 'Amul Cheese Slices' where id = 'ea68b69d-7ffe-4718-b36b-0a1591966402' and name = 'Amul cheese slices';

-- Amul kool elaichi -> Amul Kool Elaichi
update public.products set name = 'Amul Kool Elaichi' where id = '0f072e3a-2010-4d20-9c10-e009a97b2b3b' and name = 'Amul kool elaichi';

-- Amul kool badam -> Amul Kool Badam
update public.products set name = 'Amul Kool Badam' where id = 'af978e31-2824-4de8-9da4-cbceb59e6d66' and name = 'Amul kool badam';

-- Amul plain lassi -> Amul Plain Lassi
update public.products set name = 'Amul Plain Lassi' where id = 'd31b4c58-61ff-40d1-ba0e-91139bbe78b9' and name = 'Amul plain lassi';

-- Amul high protein blueberry shake -> Amul High Protein Blueberry Shake
update public.products set name = 'Amul High Protein Blueberry Shake' where id = 'f12c4c3d-f526-4df0-b814-aeba28f85f3c' and name = 'Amul high protein blueberry shake';

-- Coca-cola zero sugar -> Coca-cola Zero Sugar
update public.products set name = 'Coca-cola Zero Sugar' where id = '085e4533-5b10-4334-8055-04aeaab41875' and name = 'Coca-cola zero sugar';

-- Meat masala -> Meat Masala
update public.products set name = 'Meat Masala' where id = '17fe325c-dca1-44a4-bfec-7ba7ed439e5e' and name = 'Meat masala';

-- Mustard oil -> Mustard Oil
update public.products set name = 'Mustard Oil' where id = '8ee4ce2c-9ec5-4146-b8b4-66c405ab9269' and name = 'Mustard oil';

-- Tata sampann toor dal -> Tata Sampann Toor Dal
update public.products set name = 'Tata Sampann Toor Dal' where id = 'e3d2eaf5-47c0-4c07-9d57-76c65252d4b6' and name = 'Tata sampann toor dal';

-- Amul masti dahi -> Amul Masti Dahi
update public.products set name = 'Amul Masti Dahi' where id = '0e9188e7-e87a-48a4-92b2-2a5be54a8bb5' and name = 'Amul masti dahi';

-- Vim dishwash liquid gel lemon -> Vim Dishwash Liquid Gel Lemon
update public.products set name = 'Vim Dishwash Liquid Gel Lemon' where id = '2936bccf-cfb8-43ca-bbec-6f2a8790cc5c' and name = 'Vim dishwash liquid gel lemon';

-- Nescafe classic instant coffee -> Nescafe Classic Instant Coffee
update public.products set name = 'Nescafe Classic Instant Coffee' where id = 'ee255625-3035-4189-affa-da73b0ba0906' and name = 'Nescafe classic instant coffee';

-- Amul taaza toned milk -> Amul Taaza Toned Milk
update public.products set name = 'Amul Taaza Toned Milk' where id = 'd53d6c86-29e8-4bc7-913e-fddd37e989d5' and name = 'Amul taaza toned milk';

-- Britannia good day cashew cookies -> Britannia Good Day Cashew Cookies
update public.products set name = 'Britannia Good Day Cashew Cookies' where id = '1ee4c645-ca24-41b6-9323-136f206e7033' and name = 'Britannia good day cashew cookies';

-- Brooke bond red label tea -> Brooke Bond Red Label Tea
update public.products set name = 'Brooke Bond Red Label Tea' where id = '475b2eb8-1cdb-4de9-ac3c-d4fca9f6a84e' and name = 'Brooke bond red label tea';

-- Tata salt iodised -> Tata Salt Iodised
update public.products set name = 'Tata Salt Iodised' where id = '5c64fcfc-22b7-4751-ba51-3c776e1adffd' and name = 'Tata salt iodised';

-- Aashirvaad shudh chakki atta -> Aashirvaad Shudh Chakki Atta
update public.products set name = 'Aashirvaad Shudh Chakki Atta' where id = '8b25f8d2-7cbe-4efd-b46e-fd073b8b24d6' and name = 'Aashirvaad shudh chakki atta';

-- Amul malai paneer -> Amul Malai Paneer
update public.products set name = 'Amul Malai Paneer' where id = '2d49889f-3913-4fcb-81a3-d9a90bd25bc2' and name = 'Amul malai paneer';

-- Amul kool protein milkshake | chocolate, 180 ml -> Amul Kool Protein Milkshake | Chocolate, 180 Ml
update public.products set name = 'Amul Kool Protein Milkshake | Chocolate, 180 Ml' where id = '8994ed6c-dabb-498c-af7a-281bda2c5888' and name = 'Amul kool protein milkshake | chocolate, 180 ml';

-- Amul butter salted -> Amul Butter Salted
update public.products set name = 'Amul Butter Salted' where id = 'e47898b9-c988-4d7f-903e-4d976e925a48' and name = 'Amul butter salted';

-- Savlon handwash -> Savlon Handwash
update public.products set name = 'Savlon Handwash' where id = '6067acc3-eab1-41d0-9e01-d46a0042be75' and name = 'Savlon handwash';

-- Lay's Sizzling Hot Potato Chips 31 g -> Lay's Sizzling Hot Potato Chips 31 G
update public.products set name = 'Lay''s Sizzling Hot Potato Chips 31 G' where id = 'd8cc9258-429f-4458-9967-9dba9623b744' and name = 'Lay''s Sizzling Hot Potato Chips 31 g';

-- Jim jam -> Jim Jam
update public.products set name = 'Jim Jam' where id = '10d3a733-aa64-4919-9ccd-514e13abae32' and name = 'Jim jam';

-- Sunfeast mom's magic -> Sunfeast Mom's Magic
update public.products set name = 'Sunfeast Mom''s Magic' where id = '1e6507f7-5e23-4a4f-89b5-64244328b62e' and name = 'Sunfeast mom''s magic';

-- Oreo vanilla flavour creme sandwich biscuit -> Oreo Vanilla Flavour Creme Sandwich Biscuit
update public.products set name = 'Oreo Vanilla Flavour Creme Sandwich Biscuit' where id = '3eb8e881-ee85-49e9-8ef3-7203aa9d3c05' and name = 'Oreo vanilla flavour creme sandwich biscuit';

-- Amul rose lassi -> Amul Rose Lassi
update public.products set name = 'Amul Rose Lassi' where id = 'e9c41f45-7719-4075-aa99-7be853f7d99a' and name = 'Amul rose lassi';

commit;
