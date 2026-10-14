-- =============================================================================
-- 004_seed.sql : sample categories and products
-- -----------------------------------------------------------------------------
-- Run this FOURTH. Safe to re-run: existing rows (matched by slug) are left alone,
-- so edits you make later in the admin panel are never overwritten.
--
-- Prices are in PAISE: 29900 = Rs 299.00. "mrp_paise" is the optional
-- crossed-out "MRP" shown next to the selling price.
-- Images live in the Next.js app under public/images/<category>/...
-- =============================================================================

insert into public.categories (slug, name, description, image_url, sort_order) values
  ('cleaning-towels', 'Cleaning Towels',
   'Soft, absorbent microfiber and cotton cloths for kitchen, glass, car and every surface in your home.',
   '/images/cleaning-towels/towel-2.jpg', 1),
  ('garbage-bags', 'Garbage Bags',
   'Strong, leak-proof garbage bags in every size, including biodegradable options for a cleaner planet.',
   '/images/garbage-bags/garbage-bag-2.png', 2),
  ('oil-bottles', 'Oil Bottles',
   'Pure, healthy cooking oils in convenient 1 litre bottles: cold-pressed, kachi ghani and refined.',
   '/images/oil-bottles/oil-1.jpeg', 3)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Products (3 per category)
-- ---------------------------------------------------------------------------
insert into public.products
  (category_id, slug, name, description, price_paise, mrp_paise, stock, images, is_featured)
select c.id, v.slug, v.name, v.description, v.price_paise, v.mrp_paise, v.stock, v.images, v.is_featured
from (values
  -- Cleaning Towels -----------------------------------------------------------
  ('cleaning-towels', 'microfiber-cleaning-cloth-pack-of-6',
   'Microfiber Cleaning Cloth (Pack of 6)',
   E'Ultra-soft 350 GSM microfiber cloths that trap dust and grease without scratching.\n\n• Size: 40 × 40 cm each\n• Lint-free and streak-free on glass, mirrors and screens\n• Absorbs up to 7× its weight in water\n• Machine washable, reusable 300+ times',
   29900, 39900, 120, array['/images/cleaning-towels/towel-2.jpg'], true),

  ('cleaning-towels', 'kitchen-cleaning-towels-pack-of-4',
   'Kitchen Cleaning Towels (Pack of 4)',
   E'Thick, quick-dry waffle-weave towels for everyday kitchen use: wiping counters, drying utensils and cleaning spills.\n\n• Size: 45 × 65 cm each\n• 100% cotton, highly absorbent\n• Assorted colours\n• Machine washable',
   24900, 29900, 80, array['/images/cleaning-towels/towel-3.webp'], false),

  ('cleaning-towels', 'multi-purpose-cotton-dusters-pack-of-5',
   'Multi-purpose Cotton Dusters (Pack of 5)',
   E'Classic checked cotton dusters for dusting furniture, cleaning floors, bathrooms and vehicles.\n\n• Size: 50 × 50 cm each\n• Durable double-stitched edges\n• Soft on wood and painted surfaces\n• Washable and reusable',
   34900, 44900, 60, array['/images/cleaning-towels/towel-1.jpg'], false),

  -- Garbage Bags --------------------------------------------------------------
  ('garbage-bags', 'biodegradable-garbage-bags-small-3-rolls',
   'Biodegradable Garbage Bags, Small (3 Rolls × 30 Bags)',
   E'Eco-friendly compostable garbage bags made from corn starch, ideal for kitchen and wet waste.\n\n• Size: 45 × 50 cm (fits 10–12 L dustbins)\n• 90 bags in total\n• 100% biodegradable, no plastic\n• Leak-resistant and odour-blocking',
   19900, 24900, 150, array['/images/garbage-bags/garbage-bag-2.png'], true),

  ('garbage-bags', 'medium-black-garbage-bags-90',
   'Medium Black Garbage Bags (90 Bags)',
   E'Everyday black garbage bags for home and office dustbins.\n\n• Size: 48 × 56 cm (fits 15–20 L dustbins)\n• 3 rolls × 30 bags\n• Strong, tear-resistant 18 micron film\n• Easy tear-off perforation',
   24900, null, 100, array['/images/garbage-bags/garbage-bag-1.avif'], false),

  ('garbage-bags', 'heavy-duty-xl-garbage-bags-60',
   'Heavy-duty XL Garbage Bags (60 Bags)',
   E'Extra thick, puncture-resistant garbage bags for large bins, garden waste and moving day.\n\n• Size: 76 × 94 cm (fits 40–60 L dustbins)\n• 2 rolls × 30 bags\n• 30 micron extra-strong film\n• Leak-proof bottom seal',
   34900, 39900, 70, array['/images/garbage-bags/garbage-bag-3.jpg'], false),

  -- Cooking Oil ---------------------------------------------------------------
  ('oil-bottles', 'cold-pressed-groundnut-oil-1l',
   'Cold-pressed Groundnut Oil, 1 L',
   E'Traditionally cold-pressed (wood-pressed) groundnut oil with natural aroma and nutrients intact.\n\n• 100% pure, no chemicals or preservatives\n• Rich in vitamin E and healthy fats\n• Ideal for deep frying, curries and South Indian cooking\n• 1 litre bottle',
   32900, 38000, 90, array['/images/oil-bottles/oil-1.jpeg'], true),

  ('oil-bottles', 'kachi-ghani-mustard-oil-1l',
   'Kachi Ghani Mustard Oil, 1 L',
   E'Pungent, authentic kachi ghani (first cold press) mustard oil for North Indian and Bengali cooking, pickles and massages.\n\n• Strong natural pungency\n• Rich in omega-3 fatty acids\n• No added colour or flavour\n• 1 litre bottle',
   21900, 25000, 110, array['/images/oil-bottles/oil-2.jpg'], false),

  ('oil-bottles', 'refined-sunflower-oil-1l',
   'Refined Sunflower Oil, 1 L',
   E'Light and healthy refined sunflower oil for everyday cooking, with a neutral taste that suits every dish.\n\n• Light, non-sticky texture\n• Fortified with vitamins A & D\n• Low in saturated fat\n• 1 litre bottle',
   17900, 19900, 140, array['/images/oil-bottles/oil-3.png'], false)
) as v(category_slug, slug, name, description, price_paise, mrp_paise, stock, images, is_featured)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
