# Smart Car Matching Algorithm

## Overview
The car matching system intelligently connects dealers with buyer requests based on multiple criteria to maximize successful transactions.

## Matching Criteria & Scoring

### 1. Location Matching (30% weight)
- **Perfect Match**: Within dealer's service radius
- **Partial Match**: Within 1.5x service radius
- **No Match**: Outside service area
- Uses GPS coordinates with geolib for accurate distance calculations

### 2. Make/Model Matching (25% weight + 10% bonus)
- **Make Match**: Dealer specializes in requested make
- **Model Bonus**: Dealer has specific model in inventory
- Case-insensitive fuzzy matching for model names

### 3. Year Range Matching (15% weight)
- Checks if dealer's inventory years overlap with buyer requirements
- Considers both minimum and maximum year constraints

### 4. Mileage Compatibility (10% weight)
- Ensures dealer can provide cars within buyer's mileage limits
- Important for used car market reliability

### 5. Fuel Type Matching (10% weight)
- Exact match between buyer preference and dealer capabilities
- Critical for electric/hybrid vehicle markets

### 6. Transmission & Body Type (5% each)
- Additional preference matching
- Lower weight as these are often flexible

### 7. Budget Compatibility (5% bonus)
- Ensures dealer can offer within buyer's budget
- Additional scoring for financial feasibility

## Algorithm Flow

1. **Data Collection**: Gather dealer capabilities and buyer requirements
2. **Distance Calculation**: Compute geographical proximity
3. **Criteria Matching**: Evaluate each matching criterion
4. **Score Aggregation**: Combine weighted scores (max 100 points)
5. **Ranking**: Sort matches by score descending
6. **Filtering**: Return top N matches above minimum threshold

## Dealer Capabilities Schema

```typescript
interface DealerCapability {
  makes: string[];           // Car brands they offer
  models: string[];          // Specific models
  minYear: number;          // Oldest car year
  maxYear: number;          // Newest car year
  maxKm: number;            // Maximum mileage
  fuelTypes: string[];      // ['petrol', 'diesel', 'hybrid', 'ev']
  gearboxTypes: string[];   // ['automatic', 'manual']
  bodyTypes: string[];      // ['sedan', 'suv', 'wagon', etc.]
  maxPrice: number;         // Maximum price they offer
  serviceRadius: number;    // Service area in km
  location: {               // GPS coordinates
    lat: number;
    lng: number;
    city: string;
  };
}
```

## Benefits

- **Higher Conversion Rates**: Better matches lead to more successful sales
- **Reduced Time Waste**: Dealers see relevant opportunities only
- **Geographic Efficiency**: Local matching reduces logistics costs
- **Personalized Experience**: Each dealer sees their ideal prospects
- **Scalable**: Algorithm handles thousands of dealers/requests efficiently

## Future Enhancements

- **Machine Learning**: Learn from successful matches to improve scoring
- **Real-time Inventory**: Integrate with dealer's actual stock levels
- **Dynamic Pricing**: Adjust scores based on market conditions
- **Seasonal Trends**: Weight certain criteria based on time of year
- **Dealer Feedback**: Incorporate past performance data