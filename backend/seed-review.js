import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- CONFIGURATION ---
const REVIEWS_PER_PRODUCT_LIMIT = 12; // Max reviews a single product gets
const TOTAL_REVIEWS_TO_GENERATE = 500; // Total database insertions

// --- HUGE LIST OF REVIEWS ---

const positiveReviews = [
  // Short & Sweet
  "Absolutely love this!",
  "Five stars. No complaints.",
  "Worth every penny.",
  "Highly recommended!",
  "Exceeded my expectations.",
  "Great quality for the price.",
  "Looks exactly like the photos.",
  "A solid purchase. I'm happy.",
  
  // Detailed / Specific
  "I was skeptical at first, but the quality is actually unmatched. Will buy again.",
  "Arrived two days early! Super impressed with the shipping speed.",
  "Bought this as a gift for my brother and he loves it. Packaging was nice too.",
  "The material feels premium and sturdy. It doesn't feel cheap at all.",
  "Customer service was helpful when I had a question about sizing. The product fits perfectly.",
  "Been using this for a month now and it still looks brand new.",
  "Finally found something that actually does what it says. 10/10.",
  "Great design, sleek and modern. Fits my aesthetic perfectly.",
  "The unboxing experience was delightful. You can tell they care about details.",
  "Honest review: This is the best version of this product I've found online.",
  "Super easy to use right out of the box.",
  "I rarely leave reviews, but this deserves a shoutout. Fantastic work.",
  "Incredible value. I've seen similar items for double the price."
];

const neutralReviews = [
  // Mixed Feelings
  "It's okay, does the job but nothing special.",
  "Good for the price, but don't expect luxury quality.",
  "Decent product. Meets the basic requirements.",
  "I like it, but I probably wouldn't buy it again.",
  "It works, but the build quality feels a bit flimsy.",
  
  // Specific Issues
  "Shipping was a bit slow, took about 2 weeks to arrive.",
  "The color is slightly different in person than on the website.",
  "Smaller than I expected, but still usable.",
  "Instructions were kind of confusing, took me a while to figure out.",
  "Packaging arrived crushed, but thankfully the item was fine.",
  "It's fine. Not great, not terrible. Just fine.",
  "Wish it came in more colors. The black is a bit dull.",
  "Had a small scratch when it arrived, but not worth returning.",
  "It serves its purpose, but I've seen better alternatives at this price point.",
  "Average experience. Nothing to write home about."
];

const negativeReviews = [
  // Frustrated
  "Disappointed. Stopped working after a week.",
  "Do not buy. Complete waste of money.",
  "I regret this purchase.",
  "Terrible quality. Feels like it's going to break any second.",
  "Not as described at all.",
  
  // Specific Complaints
  "The item arrived broken and customer service hasn't replied to me.",
  "Shipping took forever and the tracking never updated.",
  "The sizing is way off. Way too small.",
  "Material is very cheap and scratchy.",
  "It looks nothing like the picture. Very misleading.",
  "I tried to return it but the process is a nightmare.",
  "Overpriced junk. You can find this at the dollar store.",
  "Missing parts in the box. Now I can't even use it.",
  "Smelled weird when I opened the package. Had to air it out.",
  "Absolute scam. Avoid this seller."
];

// Helper to get random item
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log("🚀 Starting Massive Review Seeder...");

  // 1. Fetch IDs
  const users = await prisma.users.findMany({ select: { id: true } });
  const products = await prisma.products.findMany({ select: { id: true } });

  if (users.length === 0 || products.length === 0) {
    console.error("❌ Database empty! Run the user seeder first.");
    return;
  }

  console.log(`Loaded ${users.length} users and ${products.length} products.`);

  const reviewsData = [];
  let totalGenerated = 0;

  // 2. Loop through products to distribute reviews
  for (const product of products) {
    if (totalGenerated >= TOTAL_REVIEWS_TO_GENERATE) break;

    // Randomize count: Some products get 0 reviews, some get 15 (creates popularity spikes)
    // Weighted to have more products with few reviews, fewer products with many
    const randomChance = Math.random();
    let reviewCount = 0;
    
    if (randomChance > 0.9) reviewCount = Math.floor(Math.random() * REVIEWS_PER_PRODUCT_LIMIT); // Hot products
    else if (randomChance > 0.4) reviewCount = Math.floor(Math.random() * 5); // Average products
    else reviewCount = 0; // Unpopular products

    for (let i = 0; i < reviewCount; i++) {
      const randomUser = getRandom(users);
      
      // Smart Rating Logic
      // 65% Positive, 20% Neutral, 15% Negative (Realistic e-commerce spread)
      const sentimentChance = Math.random();
      let rating, comment;

      if (sentimentChance > 0.35) {
        // POSITIVE (4-5 stars)
        rating = Math.random() > 0.3 ? 5 : 4; 
        comment = getRandom(positiveReviews);
      } else if (sentimentChance > 0.15) {
        // NEUTRAL (3 stars)
        rating = 3;
        comment = getRandom(neutralReviews);
      } else {
        // NEGATIVE (1-2 stars)
        rating = Math.random() > 0.5 ? 2 : 1;
        comment = getRandom(negativeReviews);
      }

      // Check local queue for duplicates
      const alreadyQueued = reviewsData.some(
        r => r.user_id === randomUser.id && r.product_id === product.id
      );

      if (!alreadyQueued) {
        reviewsData.push({
          user_id: randomUser.id,
          product_id: product.id,
          rating: rating,
          comment: comment,
          // Random date in last 90 days
          created_at: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)) 
        });
        totalGenerated++;
      }
    }
  }

  // 3. Insert
  console.log(`📝 Prepared ${reviewsData.length} reviews. Inserting into database...`);

  try {
    await prisma.reviews.createMany({
      data: reviewsData,
      skipDuplicates: true,
    });
    console.log(`✅ Success! Added ${reviewsData.length} new reviews.`);
  } catch (e) {
    console.error("Error inserting reviews:", e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });