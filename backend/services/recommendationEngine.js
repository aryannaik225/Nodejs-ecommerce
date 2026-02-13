import natural from 'natural';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class RecommendationEngine {
  constructor() {
    this.tfidf = new natural.TfIdf();
    this.products = [];
    this.productMap = new Map();
    this.processedDocs = [];
    this.vectors = []; 
    this.isInitialized = false;
  }

  async init() {
    console.log("⚙️  Initializing Recommendation Engine (This may take a few seconds)...");

    const rawProducts = await prisma.products.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        price: true,
        product_categories: {
          include: {
            categories: true
          }
        },
        reviews: {
            select: { rating: true }
        }
      }
    });

    if (rawProducts.length === 0) {
      console.warn("⚠️  No products found.");
      return;
    }

    this.products = rawProducts;

    this.products.forEach((product, index) => {
      this.productMap.set(product.id, product);

      const totalReviews = product.reviews.length;
      let averageRating = 0;

      if (totalReviews > 0) {
          const sum = product.reviews.reduce((acc, curr) => acc + curr.rating, 0);
          averageRating = (sum / totalReviews).toFixed(1);
      }

      product.rating = parseFloat(averageRating);
      product.reviewCount = totalReviews;

      delete product.reviews; 

      const categoryNames = product.product_categories
        .map(pc => pc.categories.name)
        .join(' ');

      const content = `${product.title} ${product.title} ${categoryNames} ${categoryNames} ${product.description}`;

      this.tfidf.addDocument(content);
      
      this.processedDocs.push({ 
          id: product.id, 
          index, 
          category: categoryNames.toLowerCase()
      });
    });

    console.log("📊 Pre-calculating vectors for speed...");
    this.vectors = this.processedDocs.map(doc => this._calculateVector(doc.index));

    this.isInitialized = true;
    console.log(`✅ Recommendation Engine Ready with ${this.products.length} products.`);
  }

  async refresh() {
    console.log("🔄 Refreshing Engine...");
    this.tfidf = new natural.TfIdf();
    this.products = [];
    this.processedDocs = [];
    this.vectors = [];
    this.productMap.clear();
    this.isInitialized = false;
    await this.init();
    return this.products.length;
  }

  _calculateVector(docIndex) {
    const terms = this.tfidf.listTerms(docIndex);
    const vec = {};
    terms.forEach(t => vec[t.term] = t.tfidf);
    return vec;
  }

  _cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (const key in vecA) {
        const val = vecA[key];
        magA += val * val;
        if (vecB[key]) {
            dotProduct += val * vecB[key];
        }
    }

    for (const key in vecB) {
        const val = vecB[key];
        magB += val * val;
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0) return 0;

    return dotProduct / (magA * magB);
  }

  recommend(targetProductId, limit = 10) {
    if (!this.isInitialized) return [];
    
    const startTime = Date.now();

    const id = parseInt(targetProductId);
    const targetIndex = this.processedDocs.findIndex(p => p.id === id);

    if (targetIndex === -1) return [];

    const targetVector = this.vectors[targetIndex];
    const targetDoc = this.processedDocs[targetIndex]; 
    const targetProduct = this.products[targetIndex]; 

    const scores = [];

    for (let i = 0; i < this.vectors.length; i++) {
        if (i === targetIndex) continue;

        const compareVector = this.vectors[i];
        const compareDoc = this.processedDocs[i];

        let similarity = this._cosineSimilarity(targetVector, compareVector);

        const targetCats = targetDoc.category.split(' ');
        const hasSharedCategory = targetCats.some(word => 
            compareDoc.category.includes(word) && word.length > 2
        );

        if (hasSharedCategory) {
            similarity = similarity * 1.5; 
        } else {
            similarity = similarity * 0.1; 
        }

        if (similarity > 0.01) { 
            scores.push({
                ...this.products[i],
                score: similarity
            });
        }
    }

    scores.sort((a, b) => b.score - a.score);

    const bucketA = scores.filter(item => 
       (item.title.includes(targetProduct.title) || targetProduct.title.includes(item.title)) 
       && item.score > 0.5
    );

    const bucketB = scores.filter(item => 
       !bucketA.includes(item)
    );

    const halfLimit = Math.floor(limit / 2);
    let finalRecs = [...bucketA.slice(0, halfLimit), ...bucketB.slice(0, limit - halfLimit)];

    if (finalRecs.length < limit) {
        const existingIds = new Set(finalRecs.map(r => r.id));
        for (const item of scores) {
            if (finalRecs.length >= limit) break;
            if (!existingIds.has(item.id)) {
                finalRecs.push(item);
                existingIds.add(item.id);
            }
        }
    }

    console.log(`⏱️ Recommendation calculation took ${Date.now() - startTime}ms`);
    
    return finalRecs;
  }
}

const engine = new RecommendationEngine();
export default engine;